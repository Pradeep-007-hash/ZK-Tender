import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const ACTIVITY_THROTTLE_MS = 3000; // Throttle activity updates to once every 3 seconds

/**
 * Custom React hook to automatically log out user after 15 minutes of inactivity.
 * Monitors user interaction events (mousemove, keydown, click, scroll, touch, wheel).
 * Persists and syncs last activity timestamp in localStorage across browser tabs.
 */
export function useSessionTimeout(user, onAutoLogout) {
  const lastActivityRef = useRef(Date.now());

  // Throttled handler to record user activity timestamp
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > ACTIVITY_THROTTLE_MS) {
      lastActivityRef.current = now;
      try {
        localStorage.setItem('zk_last_activity', now.toString());
      } catch (e) {
        console.warn('Unable to save last activity timestamp to localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Only run inactivity monitoring if user is logged in
    if (!user) {
      localStorage.removeItem('zk_last_activity');
      return;
    }

    // Check on initial load if session has already expired
    const savedLastActivity = localStorage.getItem('zk_last_activity');
    if (savedLastActivity) {
      const parsedLast = parseInt(savedLastActivity, 10);
      if (!isNaN(parsedLast) && Date.now() - parsedLast >= INACTIVITY_LIMIT_MS) {
        console.warn('[SESSION EXPIRED] Account inactive for > 15 mins. Logging out.');
        onAutoLogout();
        return;
      } else if (!isNaN(parsedLast)) {
        lastActivityRef.current = parsedLast;
      }
    } else {
      localStorage.setItem('zk_last_activity', Date.now().toString());
      lastActivityRef.current = Date.now();
    }

    const handleUserActivity = () => {
      recordActivity();
    };

    // User input events that indicate active interaction
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'pointerdown',
      'wheel'
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Helper to evaluate inactivity status
    const checkInactivity = () => {
      const storedLastStr = localStorage.getItem('zk_last_activity');
      const currentLastActivity = storedLastStr ? parseInt(storedLastStr, 10) : lastActivityRef.current;
      
      if (!isNaN(currentLastActivity) && Date.now() - currentLastActivity >= INACTIVITY_LIMIT_MS) {
        console.warn('[AUTO LOGOUT] 15 minutes inactivity reached.');
        onAutoLogout();
      }
    };

    // Periodic check interval (runs every 5 seconds)
    const intervalId = setInterval(checkInactivity, 5000);

    // Immediate check on tab focus or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    // Cross-tab synchronization via localStorage events
    const handleStorageChange = (e) => {
      if (e.key === 'zk_last_activity' && e.newValue) {
        const newTimestamp = parseInt(e.newValue, 10);
        if (!isNaN(newTimestamp)) {
          lastActivityRef.current = newTimestamp;
        }
      }
      if (e.key === 'zk_user' && e.newValue === null) {
        onAutoLogout();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, onAutoLogout, recordActivity]);
}
