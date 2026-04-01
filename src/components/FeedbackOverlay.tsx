import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';

type FeedbackType = 'correct' | 'wrong' | 'timeout' | null;

interface FeedbackOverlayProps {
  feedback: FeedbackType;
  label: string;
  streak?: number;
  correctWord?: string;   // shown when feedback === 'correct'
}

const { width } = Dimensions.get('window');

const CONFIGS: Record<NonNullable<FeedbackType>, { bg: string; icon: string; particle: string }> = {
  correct: { bg: 'rgba(22,163,74,0.93)', icon: '✅', particle: '⭐' },
  wrong:   { bg: 'rgba(220,38,38,0.93)', icon: '❌', particle: '💥' },
  timeout: { bg: 'rgba(217,119,6,0.93)', icon: '⏰', particle: '💨' },
};

const STREAK_MESSAGES = ['', '', '🔥 x2!', '🔥 x3!', '⚡ x4!', '⚡ x5!', '💥 ON FIRE!'];

export function FeedbackOverlay({ feedback, label, streak = 0, correctWord }: FeedbackOverlayProps) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.3)).current;
  const labelY   = useRef(new Animated.Value(30)).current;
  const streakS  = useRef(new Animated.Value(0)).current;

  // Floating particles
  const particles = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      angle: (Math.PI * 2 * i) / 6,
    }))
  ).current;

  useEffect(() => {
    if (!feedback) {
      opacity.setValue(0);
      scale.setValue(0.3);
      labelY.setValue(30);
      streakS.setValue(0);
      particles.forEach(p => { p.x.setValue(0); p.y.setValue(0); p.op.setValue(0); });
      return;
    }

    // Main pop-in
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(labelY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();

    // Streak badge
    if (feedback === 'correct' && streak >= 2) {
      Animated.spring(streakS, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }).start();
    }

    // Burst particles
    particles.forEach(p => {
      const dist = 80 + Math.random() * 60;
      Animated.parallel([
        Animated.timing(p.op, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: Math.cos(p.angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(p.angle) * dist, duration: 600, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(p.op, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [feedback]);

  if (!feedback) return null;
  const cfg = CONFIGS[feedback];
  const streakMsg = feedback === 'correct' && streak >= 2
    ? (STREAK_MESSAGES[Math.min(streak, STREAK_MESSAGES.length - 1)] ?? `🔥 x${streak}!`)
    : null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: cfg.bg, opacity }]}
      pointerEvents="none"
    >
      {/* Burst particles */}
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[styles.particle, {
            opacity: p.op,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }]}
        >
          {cfg.particle}
        </Animated.Text>
      ))}

      <Animated.View style={[styles.center, { transform: [{ scale }] }]}>
        <Text style={styles.icon}>{cfg.icon}</Text>
        <Animated.Text style={[styles.label, { transform: [{ translateY: labelY }] }]}>
          {label}
        </Animated.Text>
        {correctWord ? (
          <Animated.Text style={[styles.correctWord, { transform: [{ translateY: labelY }] }]}>
            {correctWord.toUpperCase()}
          </Animated.Text>
        ) : null}
      </Animated.View>

      {/* Streak badge */}
      {streakMsg && (
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakS }] }]}>
          <Text style={styles.streakText}>{streakMsg}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  center: { alignItems: 'center' },
  icon: { fontSize: 90, marginBottom: 12 },
  label: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  correctWord: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  particle: {
    position: 'absolute',
    fontSize: 28,
  },
  streakBadge: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  streakText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 26,
  },
});
