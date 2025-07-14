import { useCallback } from 'react';

export const useBackgroundTasks = () => {
  const scheduleTask = useCallback((task: () => void) => {
    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback((deadline: IdleDeadline) => {
        // Only run task if we have time remaining
        if (deadline.timeRemaining() > 0) {
          task();
        } else {
          // Schedule for next idle period
          setTimeout(() => {
            (window as any).requestIdleCallback(task);
          }, 16); // ~60fps
        }
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(task, 0);
    }
  }, []);

  const scheduleHighPriorityTask = useCallback((task: () => void) => {
    // Use MessageChannel for immediate scheduling
    const channel = new MessageChannel();
    channel.port2.onmessage = () => task();
    channel.port1.postMessage(null);
  }, []);

  return { scheduleTask, scheduleHighPriorityTask };
};