import { openDatabaseAsync } from 'expo-sqlite';

const DB_NAME = 'workix_offline.db';

let dbInstance;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await openDatabaseAsync(DB_NAME);
    await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
  }

  return dbInstance;
}

export async function initializeOfflineDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      request_id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      payload TEXT NOT NULL,
      retries INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS work_order_cache (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function run(statement, params = []) {
  const db = await getDatabase();
  return db.runAsync(statement, params);
}

export async function getAll(statement, params = []) {
  const db = await getDatabase();
  return db.getAllAsync(statement, params);
}

export async function getFirst(statement, params = []) {
  const db = await getDatabase();
  return db.getFirstAsync(statement, params);
}
