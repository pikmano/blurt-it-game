import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = ['#6C63FF', '#FF6584', '#F7B731', '#43BCCD', '#26de81', '#FC5C65'];
const PARTICLE_COUNT = 60;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
}

/**
 * Pure React Native confetti burst — no native modules required.
 * Fires once on mount; call `key` change to re-trigger.
 */
export function ConfettiAnimation() {
  const particles = useRef<Particle[]>([]).current;

  if (particles.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(0),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 8,
      });
    }
  }

  useEffect(() => {
    const animations = particles.map((p, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const speed = 200 + Math.random() * 400;
      const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * speed;
      const targetY = -50 + Math.random() * SCREEN_HEIGHT * 0.7;

      p.x.setValue(SCREEN_WIDTH / 2);
      p.y.setValue(100);
      p.opacity.setValue(1);
      p.rotate.setValue(0);

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: 1200 + Math.random() * 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.y, {
            toValue: targetY,
            duration: 800 + Math.random() * 400,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: SCREEN_HEIGHT + 100,
            duration: 600 + Math.random() * 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.rotate, {
          toValue: 6 + Math.random() * 6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(20, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const rotation = p.rotate.interpolate({
          inputRange: [0, 12],
          outputRange: ['0deg', '1440deg'],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 4,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: rotation },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
