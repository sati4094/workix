import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const OFFLINE_QUEUE_KEY = 'workix_offline_queue';
const SYNC_STATUS_KEY = 'workix_sync_status';

let syncInterval = null;
let isOnlineStatus = true;

// Initialize network listener
export function initializeOfflineQueue() {
  // Listen to network changes
  NetInfo.addEventListener(state => {
    isOnlineStatus = state.isConnected && state.isInternetReachable;
    
    if (isOnlineStatus) {
      // Process queue when coming online
      processOfflineQueue();
    }
  });
  
  // Start periodic sync (every 5 minutes)
  syncInterval = setInterval(() => {
    if (isOnlineStatus) {
      processOfflineQueue();
    }
  }, 5 * 60 * 1000);
}

// Check if online
export function isOnline() {
  return isOnlineStatus;
}

// Add request to offline queue
export async function addToOfflineQueue(request) {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueJson ? JSON.parse(queueJson) : [];
    
    queue.push({
      ...request,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'pending',
    });
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log('Request queued for offline sync:', request.url);
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }
}

// Get offline queue
export async function getOfflineQueue() {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

// Process offline queue
export async function processOfflineQueue() {
  if (!isOnlineStatus) {
    console.log('Offline - skipping queue processing');
    return;
  }

  try {
    const queue = await getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} queued requests...`);
    
    const results = [];
    const remainingQueue = [];

    for (const request of queue) {
      if (request.status === 'completed') {
        continue; // Skip already completed
      }

      try {
        // Attempt to send the request
        await api.request({
          url: request.url,
          method: request.method,
          data: request.data,
        });
        
        results.push({ id: request.id, status: 'success' });
        console.log(`✓ Synced: ${request.method.toUpperCase()} ${request.url}`);
      } catch (error) {
        console.error(`✗ Failed to sync: ${request.method.toUpperCase()} ${request.url}`, error.message);
        
        // Check if it's a permanent error (4xx) or temporary (5xx, network)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          // Permanent error - remove from queue
          results.push({ id: request.id, status: 'failed', error: error.message });
        } else {
          // Temporary error - keep in queue
          remainingQueue.push(request);
        }
      }
    }

    // Update queue with remaining items
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    
    // Update sync status
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      lastSync: Date.now(),
      synced: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      remaining: remainingQueue.length,
    }));

    console.log(`Sync complete: ${results.filter(r => r.status === 'success').length} synced, ${remainingQueue.length} remaining`);
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

// Get sync status
export async function getSyncStatus() {
  try {
    const statusJson = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return statusJson ? JSON.parse(statusJson) : null;
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return null;
  }
}

// Clear offline queue
export async function clearOfflineQueue() {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    await AsyncStorage.removeItem(SYNC_STATUS_KEY);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
}

// Cleanup on app close
export function cleanupOfflineService() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

