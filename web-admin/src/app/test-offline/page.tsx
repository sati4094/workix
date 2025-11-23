'use client';

import { useEffect, useState } from 'react';
import { getDatabaseStats } from '@/lib/database';
import { initializeSyncEngine, cleanupSyncEngine, getSyncStatus, forceSyncNow } from '@/lib/syncEngine';

export default function OfflineTestPage() {
  const [dbStats, setDbStats] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Initialize sync engine
    initializeSyncEngine();
    loadStats();

    return () => {
      cleanupSyncEngine();
    };
  }, []);

  const loadStats = async () => {
    const stats = await getDatabaseStats();
    const status = await getSyncStatus();
    setDbStats(stats);
    setSyncStatus(status);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Syncing...');
    try {
      const result = await forceSyncNow();
      if ('message' in result) {
        setMessage(result.message);
      } else {
        setMessage(`Sync completed! Pushed: ${result.pushed}, Pulled: ${result.pulled}, Conflicts: ${result.conflicts}`);
      }
    } catch (error: any) {
      setMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      await loadStats();
    }
  };

  const testCreateWorkOrder = async () => {
    const { insertWorkOrder } = await import('@/lib/database');
    try {
      const id = await insertWorkOrder({
        work_order_number: `WO-TEST-${Date.now()}`,
        title: 'Test Offline Work Order',
        description: 'Created offline for testing',
        priority: 'medium',
        status: 'open',
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      setMessage(`Created work order: ${id}`);
      await loadStats();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const clearDatabase = async () => {
    const { clearAllData } = await import('@/lib/database');
    if (confirm('Clear all offline data?')) {
      await clearAllData();
      setMessage('Database cleared');
      await loadStats();
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Offline Storage Test</h1>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${syncStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{syncStatus?.isConnected ? 'Online' : 'Offline'}</span>
          {syncing && <span className="ml-4 text-blue-600">Syncing...</span>}
        </div>
        {syncStatus?.lastSync && (
          <p className="text-sm text-gray-600 mt-2">
            Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
          </p>
        )}
      </div>

      {/* Database Stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h2 className="text-xl font-semibold mb-2">Database Statistics</h2>
        {dbStats && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Work Orders</p>
              <p className="text-2xl font-bold">{dbStats.work_orders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Unsynced Work Orders</p>
              <p className="text-2xl font-bold text-orange-600">{dbStats.unsynced_work_orders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold">{dbStats.activities}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Queue</p>
              <p className="text-2xl font-bold">{dbStats.pending_queue}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 space-x-4">
        <button
          onClick={testCreateWorkOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Test Work Order
        </button>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Force Sync Now'}
        </button>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh Stats
        </button>
        <button
          onClick={clearDatabase}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Database
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p>{message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Open DevTools → Application → IndexedDB → WorkixDB to see the database</li>
          <li>Click "Create Test Work Order" to add a record to IndexedDB</li>
          <li>Go offline (DevTools → Network → Offline)</li>
          <li>Create more work orders - they should save locally</li>
          <li>Go back online</li>
          <li>Click "Force Sync Now" to sync with backend</li>
          <li>Check the console for sync logs</li>
        </ol>
      </div>
    </div>
  );
}
