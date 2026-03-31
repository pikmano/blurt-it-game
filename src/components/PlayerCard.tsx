import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerStats } from '../types';

interface PlayerCardProps {
  stats: PlayerStats;
  isActive?: boolean;
  isWinner?: boolean;
  rank?: number;
}

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Compact player summary card used on the Results screen.
 */
export function PlayerCard({ stats, isActive, isWinner, rank }: PlayerCardProps) {
  const avatarColor = getAvatarColor(stats.name);
  const initials = stats.name.slice(0, 2).toUpperCase();

  return (
    <View
      style={[
        styles.card,
        isActive && styles.cardActive,
        isWinner && styles.cardWinner,
      ]}
    >
      {/* Rank */}
      {rank !== undefined && (
        <Text style={styles.rank}>#{rank}</Text>
      )}

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        {isWinner && <Text style={styles.trophy}>🏆</Text>}
      </View>

      {/* Name & stats */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{stats.name}</Text>
        <View style={styles.statsRow}>
          <Stat label="✅" value={stats.correct} />
          <Stat label="❌" value={stats.fouls} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#EEF2FF',
  },
  cardWinner: {
    borderColor: '#F7B731',
    backgroundColor: '#FFFBEB',
  },
  rank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
    width: 28,
    textAlign: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  trophy: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 16,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
