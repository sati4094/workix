// IndexedDB Database using Dexie.js for offline storage
import Dexie, { Table } from 'dexie';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  source?: string;
  work_type?: string;
  category?: string;
  assigned_to?: string;
  site_id?: string;
  building_id?: number;
  floor_id?: number;
  space_id?: number;
  created_at: number;
  updated_at: number;
  due_date?: number;
  completed_at?: number;
  created_by?: string;
  last_modified_at: number;
  last_modified_by?: string;
  sync_version: number;
  synced: boolean;
  deleted: boolean;
}

export interface Activity {
  id: string;
  work_order_id: string;
  activity_type: string;
  description: string;
  created_by?: string;
  created_at: number;
  ai_enhanced?: boolean;
  original_text?: string;
  last_modified_at: number;
  sync_version: number;
  synced: boolean;
  deleted: boolean;
}

export interface SyncMetadata {
  table_name: string;
  last_sync_timestamp: number;
  last_pull_timestamp: number;
  last_push_timestamp: number;
  total_synced: number;
  total_conflicts: number;
  last_error?: string;
}

export interface SyncQueue {
  id?: number;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  data: any;
  timestamp: number;
  retry_count: number;
  last_error?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

class WorkixDatabase extends Dexie {
  workOrders!: Table<WorkOrder, string>;
  activities!: Table<Activity, string>;
  syncMetadata!: Table<SyncMetadata, string>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('WorkixDB');

    this.version(1).stores({
      workOrders: 'id, status, priority, assigned_to, synced, last_modified_at',
      activities: 'id, work_order_id, synced, last_modified_at',
      syncMetadata: 'table_name',
      syncQueue: '++id, table_name, status, timestamp'
    });
  }
}

export const db = new WorkixDatabase();

// ============================================================================
// WORK ORDERS
// ============================================================================

export async function insertWorkOrder(workOrder: Partial<WorkOrder>): Promise<string> {
  const now = Date.now();
  const wo: WorkOrder = {
    ...workOrder,
    id: workOrder.id || `local_${now}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: workOrder.created_at || now,
    updated_at: now,
    last_modified_at: now,
    sync_version: 1,
    synced: false,
    deleted: false,
  } as WorkOrder;

  await db.workOrders.put(wo);
  return wo.id;
}

export async function updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<void> {
  await db.workOrders.update(id, {
    ...updates,
    updated_at: Date.now(),
    last_modified_at: Date.now(),
    synced: false,
  });
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
  return await db.workOrders.get(id);
}

export async function getAllWorkOrders(filters?: {
  status?: string;
  priority?: string;
  assigned_to?: string;
}): Promise<WorkOrder[]> {
  let query = db.workOrders.where('deleted').equals(0);

  if (filters?.status) {
    query = query.and((wo) => wo.status === filters.status);
  }
  if (filters?.priority) {
    query = query.and((wo) => wo.priority === filters.priority);
  }
  if (filters?.assigned_to) {
    query = query.and((wo) => wo.assigned_to === filters.assigned_to);
  }

  return await query.toArray();
}

export async function getUnsyncedWorkOrders(): Promise<WorkOrder[]> {
  return await db.workOrders
    .where('synced')
    .equals(0)
    .and((wo) => !wo.deleted)
    .toArray();
}

export async function markWorkOrderAsSynced(id: string, syncVersion: number): Promise<void> {
  await db.workOrders.update(id, {
    synced: true,
    sync_version: syncVersion,
  });
}

export async function deleteWorkOrder(id: string): Promise<void> {
  await db.workOrders.update(id, {
    deleted: true,
    last_modified_at: Date.now(),
    synced: false,
  });
}

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function insertActivity(activity: Partial<Activity>): Promise<string> {
  const now = Date.now();
  const act: Activity = {
    ...activity,
    id: activity.id || `local_${now}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: activity.created_at || now,
    last_modified_at: now,
    sync_version: 1,
    synced: false,
    deleted: false,
  } as Activity;

  await db.activities.put(act);
  return act.id;
}

export async function getActivitiesByWorkOrder(workOrderId: string): Promise<Activity[]> {
  return await db.activities
    .where('work_order_id')
    .equals(workOrderId)
    .and((act) => !act.deleted)
    .toArray();
}

export async function getUnsyncedActivities(): Promise<Activity[]> {
  return await db.activities
    .where('synced')
    .equals(0)
    .and((act) => !act.deleted)
    .toArray();
}

export async function markActivityAsSynced(id: string, syncVersion: number): Promise<void> {
  await db.activities.update(id, {
    synced: true,
    sync_version: syncVersion,
  });
}

// ============================================================================
// SYNC METADATA
// ============================================================================

export async function getLastSyncTimestamp(tableName: string): Promise<number> {
  const metadata = await db.syncMetadata.get(tableName);
  return metadata?.last_sync_timestamp || 0;
}

export async function updateLastSyncTimestamp(
  tableName: string,
  timestamp: number
): Promise<void> {
  await db.syncMetadata.put({
    table_name: tableName,
    last_sync_timestamp: timestamp,
    last_pull_timestamp: timestamp,
    last_push_timestamp: Date.now(),
    total_synced: 0,
    total_conflicts: 0,
  });
}

export async function getSyncStatus() {
  const workOrdersCount = await db.workOrders.where('deleted').equals(0).count();
  const activitiesCount = await db.activities.where('deleted').equals(0).count();
  const unsyncedWorkOrders = await db.workOrders.where('synced').equals(0).count();
  const unsyncedActivities = await db.activities.where('synced').equals(0).count();

  const woMetadata = await db.syncMetadata.get('work_orders');
  const actMetadata = await db.syncMetadata.get('activities');

  return {
    work_orders: {
      total: workOrdersCount,
      unsynced: unsyncedWorkOrders,
      last_sync: woMetadata?.last_sync_timestamp || null,
    },
    activities: {
      total: activitiesCount,
      unsynced: unsyncedActivities,
      last_sync: actMetadata?.last_sync_timestamp || null,
    },
    pending: {
      work_orders: unsyncedWorkOrders,
      activities: unsyncedActivities,
    },
  };
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

export async function addToSyncQueue(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  recordId: string,
  data: any
): Promise<number> {
  return await db.syncQueue.add({
    table_name: tableName,
    operation,
    record_id: recordId,
    data,
    timestamp: Date.now(),
    retry_count: 0,
    status: 'pending',
  });
}

export async function getSyncQueue(): Promise<SyncQueue[]> {
  return await db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('timestamp');
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function updateSyncQueueItem(
  id: number,
  status: 'processing' | 'failed' | 'completed',
  error?: string
): Promise<void> {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      status,
      last_error: error,
      retry_count: status === 'failed' ? item.retry_count + 1 : item.retry_count,
    });
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export async function clearAllData(): Promise<void> {
  await db.workOrders.clear();
  await db.activities.clear();
  await db.syncMetadata.clear();
  await db.syncQueue.clear();
}

export async function getDatabaseStats() {
  const workOrdersCount = await db.workOrders.count();
  const activitiesCount = await db.activities.count();
  const unsyncedWorkOrders = await db.workOrders.where('synced').equals(0).count();
  const unsyncedActivities = await db.activities.where('synced').equals(0).count();
  const queueCount = await db.syncQueue.where('status').equals('pending').count();

  return {
    work_orders: workOrdersCount,
    activities: activitiesCount,
    unsynced_work_orders: unsyncedWorkOrders,
    unsynced_activities: unsyncedActivities,
    pending_queue: queueCount,
  };
}
