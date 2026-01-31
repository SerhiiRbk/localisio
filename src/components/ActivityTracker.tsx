'use client';

import { useEffect, useRef } from 'react';

/**
 * ActivityTracker - Silently tracks user activity
 * Updates last_seen_at on mount and periodically while active
 */
export function ActivityTracker() {
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes

  useEffect(() => {
    const updateActivity = async () => {
      const now = Date.now();
      // Throttle updates to avoid too many API calls
      if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
        return;
      }
      
      lastUpdateRef.current = now;
      
      try {
        await fetch('/api/user/activity', { method: 'POST' });
      } catch (error) {
        // Silently fail - this is not critical
        console.debug('Activity update failed:', error);
      }
    };

    // Update on mount
    updateActivity();

    // Update on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic updates while tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    }, UPDATE_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // This component renders nothing
  return null;
}
