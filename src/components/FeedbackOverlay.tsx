import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type FeedbackType = 'correct' | 'wrong' | 'timeout' | null;

interface FeedbackOverlayProps {
  feedback: FeedbackType;
  label: string;
}

const COLORS: Record<NonNullable<FeedbackType>, string> = {
  correct: 'rgba(34, 197, 94, 0.92)',
  wrong: 'rgba(239, 68, 68, 0.92)',
  timeout: 'rgba(234, 179, 8, 0.92)',
};

const ICONS: Record<NonNullable<FeedbackType>, string> = {
  correct: '✅',
  wrong: '❌',
  timeout: '⏰',
};

/**
 * Full-screen flash overlay that appears briefly after each answer.
 */
export function FeedbackOverlay({ feedback, label }: FeedbackOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!feedback) {
      opacity.setValue(0);
      scale.setValue(0.5);
      return;
    }

    // Pop in
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [feedback]);

  if (!feedback) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        {
          backgroundColor: COLORS[feedback],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        <Text style={styles.icon}>{ICONS[feedback]}</Text>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  icon: {
    fontSize: 80,
    marginBottom: 12,
  },
  label: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
