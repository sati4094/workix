// Sync Engine for Tauri Desktop App
import {
  initializeDatabase,
  getUnsyncedWorkOrders,
  getUnsyncedActivities,
  markWorkOrderAsSynced,
  markActivityAsSynced,
  insertWorkOrder,
  updateWorkOrder,
  getWorkOrderById,
  getLastSyncTimestamp,
  updateLastSyncTimestamp,
  getSyncStatus,
  type WorkOrder,
  type Activity
} from './database';
import { api } from './api';

// Sync configuration
const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 50,
  RETRY_DELAY: 30 * 1000, // 30 seconds
};

// Sync state
let syncInterval: NodeJS.Timeout | null = null;
let syncInProgress = false;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeSyncEngine(): Promise<void> {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Initial online status
      isOnline = navigator.onLine;
    }

    // Start auto-sync interval
    syncInterval = setInterval(async () => {
      if (isOnline && !syncInProgress) {
        console.log('⏰ Auto-sync triggered');
        await performSync();
      }
    }, SYNC_CONFIG.AUTO_SYNC_INTERVAL);

    // Perform initial sync if online
    if (isOnline) {
      await performSync();
    }

    console.log('✅ Sync engine initialized');
  } catch (error) {
    console.error('❌ Sync engine initialization failed:', error);
    throw error;
  }
}

export function cleanupSyncEngine(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }

  console.log('✅ Sync engine cleaned up');
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleOnline(): void {
  console.log('🌐 Device is online');
  isOnline = true;
  performSync().catch(console.error);
}

function handleOffline(): void {
  console.log('📴 Device is offline');
  isOnline = false;
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

export async function performSync(options?: {
  tables?: string[];
}): Promise<{
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}> {
  if (syncInProgress) {
    return {
      success: false,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: ['Sync already in progress']
    };
  }

  if (!isOnline) {
    return {
      success: false,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: ['Device is offline']
    };
  }

  syncInProgress = true;
  let totalPushed = 0;
  let totalPulled = 0;
  let totalConflicts = 0;
  const errors: string[] = [];

  try {
    console.log('🔄 Starting sync...');

    // PUSH: Send local changes to server
    const pushResult = await syncWorkOrders('push');
    totalPushed += pushResult.pushed;
    totalConflicts += pushResult.conflicts;
    errors.push(...pushResult.errors);

    // PULL: Get server changes
    const pullResult = await syncWorkOrders('pull');
    totalPulled += pullResult.pulled;
    totalConflicts += pullResult.conflicts;
    errors.push(...pullResult.errors);

    console.log('✅ Sync completed', {
      pushed: totalPushed,
      pulled: totalPulled,
      conflicts: totalConflicts,
      errors: errors.length
    });

    return {
      success: errors.length === 0,
      pushed: totalPushed,
      pulled: totalPulled,
      conflicts: totalConflicts,
      errors
    };
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    errors.push(error.message || 'Unknown sync error');
    return {
      success: false,
      pushed: totalPushed,
      pulled: totalPulled,
      conflicts: totalConflicts,
      errors
    };
  } finally {
    syncInProgress = false;
  }
}

// ============================================================================
// WORK ORDERS SYNC
// ============================================================================

async function syncWorkOrders(direction: 'push' | 'pull'): Promise<{
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}> {
  const result = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [] as string[]
  };

  try {
    if (direction === 'push') {
      // Get unsynced local work orders
      const unsyncedWorkOrders = await getUnsyncedWorkOrders();
      
      if (unsyncedWorkOrders.length === 0) {
        console.log('📤 No work orders to push');
        return result;
      }

      console.log(`📤 Pushing ${unsyncedWorkOrders.length} work orders...`);

      // Send to server in batches
      const response = await api.sync.pushWorkOrders({
        work_orders: unsyncedWorkOrders
      });

      if (response.data.success) {
        const { inserted, updated, conflicts } = response.data.data;
        
        result.pushed = inserted + updated;
        result.conflicts = conflicts?.length || 0;

        // Mark successfully synced work orders
        for (const wo of unsyncedWorkOrders) {
          // Check if this WO had a conflict
          const hadConflict = conflicts?.some((c: any) => c.id === wo.id);
          if (!hadConflict) {
            await markWorkOrderAsSynced(wo.id, wo.sync_version + 1);
          }
        }

        console.log(`✅ Pushed: ${result.pushed}, Conflicts: ${result.conflicts}`);
      }
    } else {
      // PULL from server
      const lastSync = await getLastSyncTimestamp('work_orders');
      console.log(`📥 Pulling work orders since ${new Date(lastSync).toISOString()}...`);

      const response = await api.sync.getWorkOrders({
        updated_since: lastSync,
        limit: SYNC_CONFIG.BATCH_SIZE
      });

      if (response.data.success) {
        const serverWorkOrders: WorkOrder[] = response.data.data.work_orders;
        
        if (serverWorkOrders.length === 0) {
          console.log('📥 No new work orders from server');
          return result;
        }

        console.log(`📥 Received ${serverWorkOrders.length} work orders from server`);

        for (const serverWO of serverWorkOrders) {
          // Check if we have this work order locally
          const localWO = await getWorkOrderById(serverWO.id);

          if (!localWO) {
            // New work order from server - insert it
            await insertWorkOrder({ ...serverWO, synced: true });
            result.pulled++;
          } else if (localWO.synced) {
            // Local copy is synced - safe to update with server version
            await updateWorkOrder(serverWO.id, { ...serverWO, synced: true });
            result.pulled++;
          } else {
            // Local copy has unsynced changes - skip to avoid conflict
            console.warn(`⚠️ Skipping WO ${serverWO.id} - local changes pending`);
            result.conflicts++;
          }
        }

        // Update last sync timestamp with the maximum timestamp from this batch
        if (serverWorkOrders.length > 0) {
          const maxTimestamp = Math.max(...serverWorkOrders.map(wo => wo.last_modified_at));
          await updateLastSyncTimestamp('work_orders', maxTimestamp);
        }

        console.log(`✅ Pulled: ${result.pulled}, Skipped: ${result.conflicts}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error syncing work orders (${direction}):`, error);
    result.errors.push(error.message || `Failed to ${direction} work orders`);
  }

  return result;
}

// ============================================================================
// MANUAL SYNC
// ============================================================================

export async function forceSyncNow(): Promise<{
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
} | {
  success: boolean;
  message: string;
}> {
  if (!isOnline) {
    return {
      success: false,
      message: 'Cannot sync while offline'
    };
  }

  if (syncInProgress) {
    return {
      success: false,
      message: 'Sync already in progress'
    };
  }

  return performSync();
}

// ============================================================================
// STATUS
// ============================================================================

export function isSyncing(): boolean {
  return syncInProgress;
}

export async function getSyncEngineStatus(): Promise<{
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: number;
  pending: {
    work_orders: number;
    activities: number;
    queue: number;
  };
}> {
  const syncStatus = await getSyncStatus();
  const lastSync = await getLastSyncTimestamp('work_orders');

  return {
    isConnected: isOnline,
    isSyncing: syncInProgress,
    lastSync,
    pending: {
      work_orders: syncStatus.work_orders.unsynced,
      activities: syncStatus.activities.unsynced,
      queue: syncStatus.pending_queue
    }
  };
}
