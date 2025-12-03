import NetInfo from '@react-native-community/netinfo';
import api from './api';
import { decryptPayload, encryptPayload } from './offline/crypto';
import {
  getAll,
  getFirst,
  initializeOfflineDatabase,
  run,
} from './offline/database';

const SYNC_METADATA_KEY = 'sync_status';
const WORK_ORDER_UPDATED_AT_KEY = 'work_orders_updated_at';

let syncInterval;
let netInfoUnsubscribe;
let isOnlineStatus = true;
let isProcessingQueue = false;

const listeners = new Set();
let currentTelemetry = {
  status: 'idle',
  queueSize: 0,
  lastSync: null,
  lastError: null,
};

const randomId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function emitTelemetry(patch = {}) {
  currentTelemetry = { ...currentTelemetry, ...patch };
  listeners.forEach((listener) => listener(currentTelemetry));
}

async function setMetadata(key, value) {
  if (value === null || value === undefined) {
    await run('DELETE FROM metadata WHERE key = ?', [key]);
    return;
  }

  const serialized = JSON.stringify(value);
  await run('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', [key, serialized]);
}

async function getMetadata(key) {
  const row = await getFirst('SELECT value FROM metadata WHERE key = ?', [key]);
  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.value);
  } catch (error) {
    return row.value;
  }
}

async function hydrateTelemetryFromDisk() {
  const persisted = await getMetadata(SYNC_METADATA_KEY);
  if (persisted) {
    emitTelemetry({
      lastSync: persisted.lastSync ?? null,
    });
  }

  await refreshQueueSize();
}

async function refreshQueueSize() {
  const row = await getFirst(
    "SELECT COUNT(*) as count FROM offline_queue WHERE status != 'completed'",
  );
  emitTelemetry({ queueSize: row?.count ?? 0 });
}

function schedulePeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnlineStatus) {
      processOfflineQueue();
    }
  }, 2 * 60 * 1000);
}

async function handleConnectivityChange(state) {
  const online = state.isConnected && state.isInternetReachable !== false;
  isOnlineStatus = !!online;
  emitTelemetry({ status: online ? 'idle' : 'offline' });

  if (online) {
    await processOfflineQueue();
  }
}

export async function initializeOfflineQueue() {
  await initializeOfflineDatabase();
  await hydrateTelemetryFromDisk();

  const initialState = await NetInfo.fetch();
  await handleConnectivityChange(initialState);

  netInfoUnsubscribe = NetInfo.addEventListener(handleConnectivityChange);
  schedulePeriodicSync();
}

export function subscribeToSyncTelemetry(listener) {
  listeners.add(listener);
  listener(currentTelemetry);
  return () => listeners.delete(listener);
}

export function isOnline() {
  return isOnlineStatus;
}

export async function addToOfflineQueue(request) {
  const requestId = request.request_id ?? randomId();
  const now = Date.now();

  const payload = await encryptPayload(request.data ?? {});

  const existing = await getFirst('SELECT retries FROM offline_queue WHERE request_id = ?', [requestId]);
  const retries = existing?.retries ?? 0;

  await run(
    `INSERT OR REPLACE INTO offline_queue
      (request_id, method, url, payload, retries, status, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      requestId,
      (request.method ?? 'post').toUpperCase(),
      request.url,
      payload,
      retries,
      'pending',
      request.timestamp ?? now,
      now,
    ],
  );

  await refreshQueueSize();

  emitTelemetry({
    status: isOnlineStatus ? 'idle' : 'offline',
  });
}

export async function getOfflineQueue() {
  const rows = await getAll(
    'SELECT request_id, method, url, payload, retries, status, error, created_at FROM offline_queue ORDER BY created_at ASC',
  );

  return Promise.all(
    rows.map(async (row) => ({
      id: row.request_id,
      method: row.method,
      url: row.url,
      data: await decryptPayload(row.payload),
      retries: row.retries,
      status: row.status,
      error: row.error,
      createdAt: row.created_at,
    })),
  );
}

export async function processOfflineQueue() {
  if (!isOnlineStatus || isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;
  emitTelemetry({ status: 'syncing' });

  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      emitTelemetry({ status: 'idle' });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const entry of queue) {
      try {
        await api.request({
          url: entry.url,
          method: entry.method,
          data: entry.data,
        });

        await run('DELETE FROM offline_queue WHERE request_id = ?', [entry.id]);
        successCount += 1;
      } catch (error) {
        failedCount += 1;

        const status = error.response && error.response.status >= 400 && error.response.status < 500
          ? 'failed'
          : 'pending';

        await run(
          'UPDATE offline_queue SET retries = retries + 1, status = ?, error = ?, updated_at = ? WHERE request_id = ?',
          [
            status,
            error.message ?? 'Sync failed',
            Date.now(),
            entry.id,
          ],
        );
      }
    }

    await refreshQueueSize();

    const queueRow = await getFirst('SELECT COUNT(*) as count FROM offline_queue WHERE status = ?', ['pending']);
    const queueRemaining = queueRow?.count ?? 0;
    const lastSync = Date.now();

    await setMetadata(SYNC_METADATA_KEY, {
      lastSync,
      synced: successCount,
      failed: failedCount,
      remaining: queueRemaining,
    });

    emitTelemetry({
      status: queueRemaining > 0 ? 'idle' : 'idle',
      lastSync,
      lastError: failedCount > 0 ? 'Review sync queue' : null,
    });
  } catch (error) {
    emitTelemetry({ status: 'error', lastError: error.message });
  } finally {
    isProcessingQueue = false;
  }
}

export async function getSyncStatus() {
  const metadata = await getMetadata(SYNC_METADATA_KEY);
  const queueRow = await getFirst('SELECT COUNT(*) as count FROM offline_queue WHERE status != ?', ['completed']);
  return {
    ...(metadata ?? {}),
    status: currentTelemetry.status,
    queueSize: queueRow?.count ?? 0,
  };
}

export async function cacheWorkOrders(workOrders = []) {
  const now = Date.now();

  await Promise.all(
    workOrders.map(async (workOrder) => {
      if (!workOrder) {
        return;
      }

      const identifier = workOrder.id ?? workOrder.work_order_number;
      if (!identifier) {
        return;
      }

      const payload = await encryptPayload(workOrder);
      await run(
        'INSERT OR REPLACE INTO work_order_cache (id, payload, updated_at) VALUES (?, ?, ?)',
        [String(identifier), payload, now],
      );
    }),
  );

  await setMetadata(WORK_ORDER_UPDATED_AT_KEY, { updatedAt: now });
}

export async function getCachedWorkOrders() {
  const rows = await getAll('SELECT id, payload, updated_at FROM work_order_cache');
  const workOrders = await Promise.all(
    rows.map(async (row) => {
      const decoded = await decryptPayload(row.payload);
      return typeof decoded === 'object' ? decoded : { id: row.id, raw: decoded };
    }),
  );

  return {
    workOrders,
    metadata: await getMetadata(WORK_ORDER_UPDATED_AT_KEY),
  };
}

export async function clearOfflineQueue() {
  await run('DELETE FROM offline_queue');
  await setMetadata(SYNC_METADATA_KEY, null);
  await refreshQueueSize();
}

export function cleanupOfflineService() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = undefined;
  }

  listeners.clear();
}

