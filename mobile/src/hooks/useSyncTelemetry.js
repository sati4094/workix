import { useEffect, useState } from 'react';
import { getSyncStatus, subscribeToSyncTelemetry } from '../services/offlineService';

const INITIAL_STATE = {
  status: 'idle',
  queueSize: 0,
  lastSync: null,
  lastError: null,
};

/**
 * useSyncTelemetry provides realtime updates from the offline queue so UI pieces
 * can surface connectivity confidence to technicians.
 */
export function useSyncTelemetry() {
  const [telemetry, setTelemetry] = useState(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    getSyncStatus()
      .then((status) => {
        if (isMounted && status) {
          setTelemetry((prev) => ({ ...prev, ...status }));
        }
      })
      .catch(() => null);

    const unsubscribe = subscribeToSyncTelemetry((update) => {
      if (isMounted) {
        setTelemetry(update);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return telemetry;
}
