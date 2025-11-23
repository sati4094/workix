'use client';

import { useEffect, useState } from 'react';
import {
  initializeDatabase,
  getDatabaseStats,
  getSyncStatus,
  insertWorkOrder,
  getAllWorkOrders,
  clearAllData,
  type WorkOrder
} from '@/lib/database';
import {
  initializeSyncEngine,
  cleanupSyncEngine,
  getSyncEngineStatus,
  forceSyncNow,
  isSyncing
} from '@/lib/syncEngine';

export default function OfflineTestPage() {
  const [dbStats, setDbStats] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log('🚀 Starting initialization...');
        
        // Check if Tauri is available
        if (typeof window === 'undefined' || !(window as any).__TAURI__) {
          throw new Error('This page must be run in the Tauri desktop app');
        }

        console.log('✅ Tauri environment detected');
        
        await initializeSyncEngine();
        
        if (mounted) {
          console.log('✅ Sync engine initialized');
          setInitialized(true);
          await loadStats();
          setMessage('✅ Offline database ready!');
        }
      } catch (error: any) {
        console.error('❌ Initialization error:', error);
        setError(error.message || 'Unknown error');
        setMessage(`⚠️ Initialization failed: ${error.message}`);
      }
    }

    init();

    return () => {
      mounted = false;
      cleanupSyncEngine();
    };
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getDatabaseStats();
      const status = await getSyncEngineStatus();
      const orders = await getAllWorkOrders();
      
      setDbStats(stats);
      setSyncStatus(status);
      setWorkOrders(orders);
    } catch (error: any) {
      console.error('Load stats error:', error);
      setMessage(`Error loading stats: ${error.message}`);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    setMessage('Syncing...');
    
    try {
      const result = await forceSyncNow();
      
      if ('message' in result) {
        setMessage(result.message);
      } else {
        setMessage(
          `✅ Sync completed! Pushed: ${result.pushed}, Pulled: ${result.pulled}, Conflicts: ${result.conflicts}`
        );
      }
    } catch (error: any) {
      setMessage(`❌ Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      await loadStats();
    }
  };

  const handleCreateTestWorkOrder = async () => {
    try {
      const now = Date.now();
      const id = await insertWorkOrder({
        work_order_number: `WO-DESKTOP-${now}`,
        title: 'Test Desktop Offline Work Order',
        description: 'Created offline in Tauri desktop app',
        priority: 'medium',
        status: 'open',
        created_at: now,
        updated_at: now,
        last_modified_at: now,
        synced: false,
        deleted: false
      });
      
      setMessage(`✅ Created work order: ${id}`);
      await loadStats();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Clear all offline data? This cannot be undone.')) return;
    
    try {
      await clearAllData();
      setMessage('✅ Database cleared');
      await loadStats();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          {!error ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">Initializing offline database...</p>
              {message && <p className="text-sm text-gray-500">{message}</p>}
            </>
          ) : (
            <>
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-red-600 mb-2">Initialization Failed</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <div className="text-left bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Make sure you're running this in the Tauri desktop app</li>
                  <li>Check the browser console for detailed errors</li>
                  <li>Verify Tauri SQL plugin is installed</li>
                  <li>Try restarting the desktop app</li>
                </ul>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Desktop Offline Storage Test</h1>
      <p className="text-gray-600 mb-8">Testing Tauri SQLite + Sync Engine</p>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${syncStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">{syncStatus?.isConnected ? 'Online' : 'Offline'}</span>
          </div>
          {syncing && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Syncing...</span>
            </div>
          )}
        </div>
        {syncStatus?.lastSync > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
          </p>
        )}
      </div>

      {/* Database Statistics */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-3">Database Statistics</h2>
        {dbStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600">Total Work Orders</p>
              <p className="text-2xl font-bold">{dbStats.work_orders}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600">Unsynced</p>
              <p className="text-2xl font-bold text-orange-600">{dbStats.unsynced_work_orders}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-2xl font-bold">{dbStats.activities}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600">Pending Queue</p>
              <p className="text-2xl font-bold">{dbStats.pending_queue}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleCreateTestWorkOrder}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 transition shadow-md"
        >
          Create Test Work Order
        </button>
        <button
          onClick={handleSync}
          disabled={syncing || !syncStatus?.isConnected}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Syncing...' : 'Force Sync Now'}
        </button>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Refresh Stats
        </button>
        <button
          onClick={handleClearDatabase}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Clear Database
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Work Orders List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Local Work Orders ({workOrders.length})</h2>
        {workOrders.length === 0 ? (
          <p className="text-gray-500 italic">No work orders in local database</p>
        ) : (
          <div className="space-y-2">
            {workOrders.slice(0, 10).map((wo) => (
              <div key={wo.id} className="p-3 bg-white border border-gray-200 rounded flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{wo.title}</p>
                  <p className="text-sm text-gray-600">{wo.work_order_number} • {wo.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${wo.synced ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {wo.synced ? 'Synced' : 'Pending'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    wo.priority === 'high' ? 'bg-red-100 text-red-800' :
                    wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {wo.priority}
                  </span>
                </div>
              </div>
            ))}
            {workOrders.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                Showing 10 of {workOrders.length} work orders
              </p>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-semibold mb-2">🧪 Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Click "Create Test Work Order" to add records to SQLite</li>
          <li>Check database stats - unsynced count should increase</li>
          <li>Go offline (disconnect network) and create more orders</li>
          <li>Go back online and click "Force Sync Now"</li>
          <li>Watch records sync to backend at http://localhost:5000</li>
          <li>Check database stats - unsynced count should decrease</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 rounded">
          <p className="text-sm font-medium text-blue-900">💡 Native SQLite Benefits:</p>
          <ul className="text-sm text-blue-800 ml-4 mt-1 space-y-1">
            <li>• Faster than browser IndexedDB</li>
            <li>• No storage quota limits</li>
            <li>• Works completely offline</li>
            <li>• Native file system access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
