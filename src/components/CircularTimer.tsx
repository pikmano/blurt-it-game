import React from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularTimerProps {
  secondsLeft: number;
  progress: Animated.Value; // 1.0 → 0.0
  size?: number;
  strokeWidth?: number;
  totalSeconds: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A circular progress ring that shows remaining time.
 * Color transitions green → yellow → red as time runs out.
 */
export function CircularTimer({
  secondsLeft,
  progress,
  size = 160,
  strokeWidth = 12,
  totalSeconds,
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animate strokeDashoffset: 0 (full) → circumference (empty)
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Color: green → yellow → red
  const fraction = secondsLeft / totalSeconds;
  let color = '#22C55E'; // green
  if (fraction <= 0.5) color = '#EAB308'; // yellow
  if (fraction <= 0.25) color = '#EF4444'; // red

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Rotate so the arc starts at top
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.labelContainer}>
          <Text style={[styles.number, { color }]}>{secondsLeft}</Text>
          <Text style={styles.unit}>sec</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
  },
  unit: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
});
