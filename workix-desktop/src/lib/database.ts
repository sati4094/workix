// Tauri SQLite Database Service for Offline Support
import Database from '@tauri-apps/plugin-sql';

// Types
export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  type?: string;
  category?: string;
  assigned_to?: string;
  created_by?: string;
  site_id?: string;
  building_id?: string;
  floor_id?: string;
  space_id?: string;
  asset_id?: string;
  estimated_hours?: number;
  actual_hours?: number;
  scheduled_start?: number;
  scheduled_end?: number;
  actual_start?: number;
  actual_end?: number;
  created_at: number;
  updated_at: number;
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

export interface SyncQueueItem {
  id?: number;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  data: string; // JSON string
  timestamp: number;
  retry_count: number;
  last_error?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

// Database instance
let db: Database | null = null;

// Initialize database
export async function initializeDatabase(): Promise<void> {
  if (db) return;

  try {
    // Check if we're in a Tauri environment
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      throw new Error('Not running in Tauri environment');
    }

    console.log('🔧 Initializing SQLite database...');
    
    // Load SQLite database
    db = await Database.load('sqlite:workix.db');
    
    console.log('📦 Creating database tables...');
    
    // Create tables
    await createTables();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Create database tables
async function createTables(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Work Orders table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      work_order_number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT,
      category TEXT,
      assigned_to TEXT,
      created_by TEXT,
      site_id TEXT,
      building_id TEXT,
      floor_id TEXT,
      space_id TEXT,
      asset_id TEXT,
      estimated_hours REAL,
      actual_hours REAL,
      scheduled_start INTEGER,
      scheduled_end INTEGER,
      actual_start INTEGER,
      actual_end INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_modified_at INTEGER NOT NULL,
      last_modified_by TEXT,
      sync_version INTEGER DEFAULT 1,
      synced INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    )
  `);

  // Activities table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      work_order_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_by TEXT,
      created_at INTEGER NOT NULL,
      last_modified_at INTEGER NOT NULL,
      sync_version INTEGER DEFAULT 1,
      synced INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    )
  `);

  // Sync metadata table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_sync_timestamp INTEGER DEFAULT 0,
      last_pull_timestamp INTEGER DEFAULT 0,
      last_push_timestamp INTEGER DEFAULT 0,
      total_synced INTEGER DEFAULT 0,
      total_conflicts INTEGER DEFAULT 0,
      last_error TEXT
    )
  `);

  // Sync queue table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Create indexes
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders(priority)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wo_assigned ON work_orders(assigned_to)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wo_synced ON work_orders(synced)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wo_modified ON work_orders(last_modified_at)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_activities_wo ON activities(work_order_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_activities_synced ON activities(synced)');

  console.log('✅ Database tables created');
}

// ============================================================================
// WORK ORDERS CRUD
// ============================================================================

export async function insertWorkOrder(workOrder: Partial<WorkOrder>): Promise<string> {
  if (!db) throw new Error('Database not initialized');

  const id = workOrder.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await db.execute(
    `INSERT INTO work_orders (
      id, work_order_number, title, description, priority, status, type, category,
      assigned_to, created_by, site_id, building_id, floor_id, space_id, asset_id,
      estimated_hours, actual_hours, scheduled_start, scheduled_end, actual_start, actual_end,
      created_at, updated_at, last_modified_at, last_modified_by, sync_version, synced, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, workOrder.work_order_number || `WO-LOCAL-${Date.now()}`, workOrder.title || 'Untitled',
      workOrder.description, workOrder.priority || 'medium', workOrder.status || 'open',
      workOrder.type, workOrder.category, workOrder.assigned_to, workOrder.created_by,
      workOrder.site_id, workOrder.building_id, workOrder.floor_id, workOrder.space_id, workOrder.asset_id,
      workOrder.estimated_hours, workOrder.actual_hours, workOrder.scheduled_start, workOrder.scheduled_end,
      workOrder.actual_start, workOrder.actual_end, workOrder.created_at || now, workOrder.updated_at || now,
      workOrder.last_modified_at || now, workOrder.last_modified_by, workOrder.sync_version || 1,
      workOrder.synced ? 1 : 0, workOrder.deleted ? 1 : 0
    ]
  );

  return id;
}

export async function updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(key === 'synced' || key === 'deleted' ? (value ? 1 : 0) : value);
    }
  });

  fields.push('updated_at = ?', 'last_modified_at = ?', 'synced = 0');
  values.push(now, now, id);

  await db.execute(
    `UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<WorkOrder[]>(
    'SELECT * FROM work_orders WHERE id = ? AND deleted = 0',
    [id]
  );

  return result.length > 0 ? convertToWorkOrder(result[0]) : null;
}

export async function getAllWorkOrders(filters?: {
  status?: string;
  priority?: string;
  assigned_to?: string;
}): Promise<WorkOrder[]> {
  if (!db) throw new Error('Database not initialized');

  let query = 'SELECT * FROM work_orders WHERE deleted = 0';
  const params: any[] = [];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }
  if (filters?.assigned_to) {
    query += ' AND assigned_to = ?';
    params.push(filters.assigned_to);
  }

  query += ' ORDER BY last_modified_at DESC';

  const result = await db.select<WorkOrder[]>(query, params);
  return result.map(convertToWorkOrder);
}

export async function getUnsyncedWorkOrders(): Promise<WorkOrder[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<WorkOrder[]>(
    'SELECT * FROM work_orders WHERE synced = 0 ORDER BY last_modified_at ASC'
  );

  return result.map(convertToWorkOrder);
}

export async function markWorkOrderAsSynced(id: string, syncVersion: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute(
    'UPDATE work_orders SET synced = 1, sync_version = ? WHERE id = ?',
    [syncVersion, id]
  );
}

export async function deleteWorkOrder(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute(
    'UPDATE work_orders SET deleted = 1, synced = 0, last_modified_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

// ============================================================================
// ACTIVITIES CRUD
// ============================================================================

export async function insertActivity(activity: Partial<Activity>): Promise<string> {
  if (!db) throw new Error('Database not initialized');

  const id = activity.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await db.execute(
    `INSERT INTO activities (
      id, work_order_id, activity_type, description, created_by,
      created_at, last_modified_at, sync_version, synced, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, activity.work_order_id, activity.activity_type || 'comment',
      activity.description || '', activity.created_by,
      activity.created_at || now, activity.last_modified_at || now,
      activity.sync_version || 1, activity.synced ? 1 : 0, activity.deleted ? 1 : 0
    ]
  );

  return id;
}

export async function getActivitiesByWorkOrder(workOrderId: string): Promise<Activity[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<Activity[]>(
    'SELECT * FROM activities WHERE work_order_id = ? AND deleted = 0 ORDER BY created_at DESC',
    [workOrderId]
  );

  return result.map(convertToActivity);
}

export async function getUnsyncedActivities(): Promise<Activity[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<Activity[]>(
    'SELECT * FROM activities WHERE synced = 0 ORDER BY last_modified_at ASC'
  );

  return result.map(convertToActivity);
}

export async function markActivityAsSynced(id: string, syncVersion: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute(
    'UPDATE activities SET synced = 1, sync_version = ? WHERE id = ?',
    [syncVersion, id]
  );
}

// ============================================================================
// SYNC METADATA
// ============================================================================

export async function getLastSyncTimestamp(tableName: string): Promise<number> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<SyncMetadata[]>(
    'SELECT last_sync_timestamp FROM sync_metadata WHERE table_name = ?',
    [tableName]
  );

  return result.length > 0 ? result[0].last_sync_timestamp : 0;
}

export async function updateLastSyncTimestamp(tableName: string, timestamp: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute(
    `INSERT INTO sync_metadata (table_name, last_sync_timestamp) VALUES (?, ?)
     ON CONFLICT(table_name) DO UPDATE SET last_sync_timestamp = ?`,
    [tableName, timestamp, timestamp]
  );
}

export async function getSyncStatus(): Promise<{
  work_orders: { total: number; unsynced: number; last_sync: number };
  activities: { total: number; unsynced: number; last_sync: number };
  pending_queue: number;
}> {
  if (!db) throw new Error('Database not initialized');

  const woTotal = await db.select<{count: number}[]>(
    'SELECT COUNT(*) as count FROM work_orders WHERE deleted = 0'
  );
  const woUnsynced = await db.select<{count: number}[]>(
    'SELECT COUNT(*) as count FROM work_orders WHERE synced = 0 AND deleted = 0'
  );
  const woLastSync = await getLastSyncTimestamp('work_orders');

  const actTotal = await db.select<{count: number}[]>(
    'SELECT COUNT(*) as count FROM activities WHERE deleted = 0'
  );
  const actUnsynced = await db.select<{count: number}[]>(
    'SELECT COUNT(*) as count FROM activities WHERE synced = 0 AND deleted = 0'
  );
  const actLastSync = await getLastSyncTimestamp('activities');

  const queuePending = await db.select<{count: number}[]>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"'
  );

  return {
    work_orders: {
      total: woTotal[0].count,
      unsynced: woUnsynced[0].count,
      last_sync: woLastSync
    },
    activities: {
      total: actTotal[0].count,
      unsynced: actUnsynced[0].count,
      last_sync: actLastSync
    },
    pending_queue: queuePending[0].count
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
  if (!db) throw new Error('Database not initialized');

  const result = await db.execute(
    `INSERT INTO sync_queue (table_name, operation, record_id, data, timestamp, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [tableName, operation, recordId, JSON.stringify(data), Date.now()]
  );

  return result.lastInsertId || 0;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.select<SyncQueueItem[]>(
    'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY timestamp ASC'
  );

  return result;
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function updateSyncQueueItem(
  id: number,
  status: string,
  error?: string
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute(
    'UPDATE sync_queue SET status = ?, last_error = ?, retry_count = retry_count + 1 WHERE id = ?',
    [status, error, id]
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

export async function clearAllData(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execute('DELETE FROM work_orders');
  await db.execute('DELETE FROM activities');
  await db.execute('DELETE FROM sync_metadata');
  await db.execute('DELETE FROM sync_queue');

  console.log('✅ All data cleared');
}

export async function getDatabaseStats(): Promise<{
  work_orders: number;
  activities: number;
  unsynced_work_orders: number;
  unsynced_activities: number;
  pending_queue: number;
}> {
  if (!db) throw new Error('Database not initialized');

  const woCount = await db.select<{count: number}[]>('SELECT COUNT(*) as count FROM work_orders WHERE deleted = 0');
  const actCount = await db.select<{count: number}[]>('SELECT COUNT(*) as count FROM activities WHERE deleted = 0');
  const woUnsyncedCount = await db.select<{count: number}[]>('SELECT COUNT(*) as count FROM work_orders WHERE synced = 0 AND deleted = 0');
  const actUnsyncedCount = await db.select<{count: number}[]>('SELECT COUNT(*) as count FROM activities WHERE synced = 0 AND deleted = 0');
  const queueCount = await db.select<{count: number}[]>('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"');

  return {
    work_orders: woCount[0].count,
    activities: actCount[0].count,
    unsynced_work_orders: woUnsyncedCount[0].count,
    unsynced_activities: actUnsyncedCount[0].count,
    pending_queue: queueCount[0].count
  };
}

// Helper functions to convert SQLite integers to booleans
function convertToWorkOrder(row: any): WorkOrder {
  return {
    ...row,
    synced: Boolean(row.synced),
    deleted: Boolean(row.deleted)
  };
}

function convertToActivity(row: any): Activity {
  return {
    ...row,
    synced: Boolean(row.synced),
    deleted: Boolean(row.deleted)
  };
}

// Export database instance for direct access if needed
export function getDatabase(): Database | null {
  return db;
}
