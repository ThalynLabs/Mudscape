import { useEffect, useRef, useCallback } from 'react';
import type { MudTimer } from '@shared/schema';

interface UseTimersOptions {
  timers: MudTimer[];
  onExecute: (script: string) => void;
  onDisableTimer?: (id: string) => void;
  enabled?: boolean;
}

export function useTimers({ timers, onExecute, onDisableTimer, enabled = true }: UseTimersOptions) {
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const clearAllTimers = useCallback(() => {
    intervalsRef.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    intervalsRef.current.clear();
  }, []);

  useEffect(() => {
    clearAllTimers();

    if (!enabled) return;

    timers.forEach((timer) => {
      if (!timer.active) return;

      const execute = () => {
        try {
          onExecute(timer.script);
        } catch (err) {
          console.error(`Timer "${timer.name}" execution error:`, err);
        }

        if (timer.oneShot) {
          const intervalId = intervalsRef.current.get(timer.id);
          if (intervalId) {
            clearInterval(intervalId);
            intervalsRef.current.delete(timer.id);
          }
          onDisableTimer?.(timer.id);
        }
      };

      const intervalId = setInterval(execute, timer.interval);
      intervalsRef.current.set(timer.id, intervalId);
    });

    return clearAllTimers;
  }, [timers, onExecute, onDisableTimer, enabled, clearAllTimers]);

  return { clearAllTimers };
}
