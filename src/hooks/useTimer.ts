import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseTimerOptions {
  durationSeconds: number;
  onExpire: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  secondsLeft: number;
  progress: Animated.Value; // 1.0 → 0.0 as time runs out
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Countdown timer hook. Fires `onExpire` when time reaches 0.
 * `progress` is an Animated.Value from 1.0 (full) → 0.0 (empty)
 * suitable for driving a circular progress ring.
 */
export function useTimer({
  durationSeconds,
  onExpire,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const progress = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh so callers don't need to memoize it
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    animRef.current?.stop();
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSecondsLeft(durationSeconds);
    progress.setValue(1);
  }, [stop, durationSeconds, progress]);

  const start = useCallback(() => {
    // Reset state
    setSecondsLeft(durationSeconds);
    progress.setValue(1);
    setIsRunning(true);

    // Smooth animated progress ring
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start();

    // Discrete second counter for the displayed number
    let remaining = durationSeconds;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsRunning(false);
        onExpireRef.current();
      }
    }, 1000);
  }, [durationSeconds, progress]);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { secondsLeft, progress, isRunning, start, stop, reset };
}
