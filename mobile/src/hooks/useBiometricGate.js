import { useCallback, useEffect, useRef, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

const FALLBACK_DELAY_MS = 2000;

/**
 * useBiometricGate prompts the user for biometric or device credentials before
 * allowing access to the authenticated shell. It exposes control flags so the
 * navigator can render a lock screen while authentication is in flight.
 */
export function useBiometricGate(shouldRequireGate) {
  const [isUnlocked, setIsUnlocked] = useState(!shouldRequireGate);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const retryTimer = useRef();

  const clearTimer = () => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    }
  };

  const evaluate = useCallback(async () => {
    if (!shouldRequireGate) {
      setIsUnlocked(true);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const isEnrolled = await LocalAuthentication.hasHardwareAsync();
      if (!isEnrolled) {
        setIsUnlocked(true);
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!types || types.length === 0) {
        setIsUnlocked(true);
        return;
      }

      const results = await LocalAuthentication.authenticateAsync({
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        promptMessage: 'Unlock Workix',
        fallbackLabel: 'Use device credentials',
      });

      if (results.success) {
        setIsUnlocked(true);
      } else if (results.error === 'unknown') {
        setError('Biometric authentication failed. Try again.');
      } else if (results.error === 'user_cancel' || results.error === 'system_cancel') {
        setError('Authentication cancelled. Tap retry to continue.');
      } else {
        setError(results.warning || 'Authentication failed.');
      }
    } catch (err) {
      console.warn('Biometric evaluation failed', err);
      setError(err.message || 'Biometric authentication unavailable.');
      retryTimer.current = setTimeout(() => setIsUnlocked(true), FALLBACK_DELAY_MS);
    } finally {
      setIsChecking(false);
    }
  }, [shouldRequireGate]);

  useEffect(() => {
    evaluate();

    return () => {
      clearTimer();
    };
  }, [evaluate]);

  const retry = useCallback(() => {
    clearTimer();
    evaluate();
  }, [evaluate]);

  const unlockFallback = useCallback(() => {
    clearTimer();
    setIsUnlocked(true);
  }, []);

  return {
    error,
    isChecking,
    isUnlocked,
    retry,
    unlockFallback,
  };
}
