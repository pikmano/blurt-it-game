import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseTimerOptions {
  durationSeconds: number;
  onExpire: () => void;
}

interface UseTimerReturn {
  secondsLeft: number;
  progress: Animated.Value; // 1.0 → 0.0 as time runs out
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Countdown timer hook. Fires `onExpire` when time reaches 0.
 * `progress` is an Animated.Value from 1.0 (full) → 0.0 (empty).
 *
 * Safe to call `start()` multiple times — always clears the previous
 * interval before starting a new one.
 */
export function useTimer({ durationSeconds, onExpire }: UseTimerOptions): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const progress = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // Always read the latest callbacks/values via refs — avoids stale closures
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const durationRef = useRef(durationSeconds);
  useEffect(() => { durationRef.current = durationSeconds; }, [durationSeconds]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    animRef.current?.stop();
    animRef.current = null;
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    // Always clear any existing timer before starting fresh
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    animRef.current?.stop();
    animRef.current = null;

    const duration = durationRef.current;

    // Reset display
    setSecondsLeft(duration);
    progress.setValue(1);
    setIsRunning(true);

    // Smooth ring animation
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: duration * 1000,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start();

    // Integer second countdown
    let remaining = duration;
    const id = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        intervalRef.current = null;
        setIsRunning(false);
        onExpireRef.current();
      }
    }, 1000);
    intervalRef.current = id;
  }, [progress]); // progress is stable (useRef.current)

  // Clean up on unmount
  useEffect(() => () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    animRef.current?.stop();
  }, []);

  return { secondsLeft, progress, isRunning, start, stop };
}
