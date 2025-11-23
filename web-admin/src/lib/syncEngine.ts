// Sync Engine for Web Admin - Bi-directional sync with backend
import { api } from './api';
import {
  db,
  getUnsyncedWorkOrders,
  getUnsyncedActivities,
  markWorkOrderAsSynced,
  markActivityAsSynced,
  insertWorkOrder,
  updateWorkOrder,
  insertActivity,
  getLastSyncTimestamp,
  updateLastSyncTimestamp,
  WorkOrder,
  Activity,
} from './database';

let syncInProgress = false;
let syncInterval: NodeJS.Timeout | null = null;

const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 50,
  RETRY_DELAY: 30 * 1000, // 30 seconds
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeSyncEngine() {
  console.log('🔄 Initializing web sync engine...');

  // Listen to online/offline events
  window.addEventListener('online', () => {
    console.log('📡 Browser online - triggering sync');
    performSync();
  });

  window.addEventListener('offline', () => {
    console.log('📡 Browser offline');
  });

  // Start periodic sync
  syncInterval = setInterval(() => {
    if (!syncInProgress && navigator.onLine) {
      performSync();
    }
  }, SYNC_CONFIG.AUTO_SYNC_INTERVAL);

  // Initial sync
  if (navigator.onLine) {
    performSync();
  }

  console.log('✓ Web sync engine initialized');
}

export function cleanupSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  console.log('✓ Web sync engine cleaned up');
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

export async function performSync(options: { tables?: string[] } = {}) {
  if (syncInProgress) {
    console.log('⏸️  Sync already in progress');
    return { success: false, message: 'Sync already in progress' };
  }

  if (!navigator.onLine) {
    console.log('⏸️  Browser offline, sync skipped');
    return { success: false, message: 'Browser offline' };
  }

  syncInProgress = true;
  console.log('🔄 Starting bi-directional sync...');

  const results = {
    success: true,
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [] as string[],
  };

  try {
    // PUSH: Send local changes to server
    const pushResults = await syncWorkOrders('push');
    results.pushed += pushResults.pushed;
    results.conflicts += pushResults.conflicts;
    results.errors.push(...pushResults.errors);

    // PULL: Get server changes
    const pullResults = await syncWorkOrders('pull');
    results.pulled += pullResults.pulled;

    console.log('✅ Sync completed', results);
    return results;
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    results.success = false;
    results.errors.push(error.message);
    return results;
  } finally {
    syncInProgress = false;
  }
}

// ============================================================================
// WORK ORDERS SYNC
// ============================================================================

async function syncWorkOrders(direction: 'push' | 'pull') {
  const results = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [] as string[],
  };

  if (direction === 'push') {
    // Get unsynced local work orders
    const unsyncedWorkOrders = await getUnsyncedWorkOrders();

    if (unsyncedWorkOrders.length > 0) {
      console.log(`📤 Pushing ${unsyncedWorkOrders.length} work orders...`);

      try {
        const response = await api.post('/sync/work-orders', {
          work_orders: unsyncedWorkOrders,
        });

        if (response.data?.inserted) {
          results.pushed += response.data.inserted;
        }
        if (response.data?.updated) {
          results.pushed += response.data.updated;
        }
        if (response.data?.conflicts) {
          results.conflicts += response.data.conflicts.length;
        }

        // Mark successfully synced records
        for (const wo of unsyncedWorkOrders) {
          if (!response.data.conflicts?.find((c: any) => c.id === wo.id)) {
            await markWorkOrderAsSynced(wo.id, wo.sync_version + 1);
          }
        }
      } catch (error: any) {
        console.error('Push error:', error);
        results.errors.push(`Push failed: ${error.message}`);
      }
    }
  }

  if (direction === 'pull') {
    // Get updates from server
    const lastSync = await getLastSyncTimestamp('work_orders');
    console.log(`📥 Pulling work orders updated since ${lastSync}...`);

    try {
      const response = await api.get('/sync/work-orders', {
        params: {
          updated_since: lastSync,
          limit: SYNC_CONFIG.BATCH_SIZE,
        },
      });

      const serverWorkOrders = response.data?.work_orders || [];
      console.log(`  → Received ${serverWorkOrders.length} work orders`);

      for (const serverWO of serverWorkOrders) {
        try {
          const localWO = await db.workOrders.get(serverWO.id);

          if (!localWO) {
            // New record from server - insert
            await insertWorkOrder({
              ...serverWO,
              synced: true,
            });
            results.pulled++;
          } else if (localWO.synced) {
            // Local record is synced - update with server data
            await updateWorkOrder(serverWO.id, {
              ...serverWO,
              synced: true,
            });
            results.pulled++;
          } else {
            // Local record has pending changes - skip to avoid overwriting
            console.log(`  ⚠️  Skipping ${serverWO.id} - has local changes`);
          }
        } catch (error: any) {
          results.errors.push(`Failed to process WO ${serverWO.id}: ${error.message}`);
        }
      }

      // Update last sync timestamp
      if (serverWorkOrders.length > 0) {
        const latestTimestamp = Math.max(
          ...serverWorkOrders.map((wo: any) => wo.last_modified_at)
        );
        await updateLastSyncTimestamp('work_orders', latestTimestamp);
      } else {
        await updateLastSyncTimestamp('work_orders', Date.now());
      }
    } catch (error: any) {
      console.error('Pull error:', error);
      results.errors.push(`Pull failed: ${error.message}`);
    }
  }

  return results;
}

// ============================================================================
// MANUAL SYNC
// ============================================================================

export async function forceSyncNow() {
  console.log('🔄 Manual sync triggered');
  return await performSync();
}

export function isSyncing() {
  return syncInProgress;
}

export async function getSyncStatus() {
  const stats = await db.syncMetadata.toArray();
  const unsyncedWO = await getUnsyncedWorkOrders();
  const unsyncedAct = await getUnsyncedActivities();

  return {
    isConnected: navigator.onLine,
    isSyncing: syncInProgress,
    lastSync: stats[0]?.last_sync_timestamp || null,
    pending: {
      work_orders: unsyncedWO.length,
      activities: unsyncedAct.length,
    },
  };
}
