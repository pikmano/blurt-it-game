import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, PlayerStats, Category } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';
import { getWinner, getBestCategory, getHardestLetter, getAverageResponseTime } from '../utils/stats';
import { saveGameResult } from '../utils/storage';
import { generateId } from '../utils/randomPicker';
import { ConfettiAnimation } from '../components/ConfettiAnimation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
};

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

export function ResultsScreen({ navigation }: Props) {
  const { strings, isRTL } = useAppSettings();
  const { state, dispatch } = useGame();
  const t = strings;
  const [saved, setSaved] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  if (!state.config) {
    navigation.replace('Home');
    return null;
  }

  const winnerId = getWinner(state.playerStats);
  const winnerStats = winnerId ? state.playerStats[winnerId] : null;

  // Sort players: winner first, then by fouls asc, then correct desc
  const sortedPlayers = Object.values(state.playerStats).sort((a, b) => {
    if (a.fouls !== b.fouls) return a.fouls - b.fouls;
    return b.correct - a.correct;
  });

  // Save to history once
  useEffect(() => {
    if (!saved && state.config) {
      setSaved(true);
      saveGameResult({
        id: generateId(),
        date: Date.now(),
        config: state.config,
        playerStats: state.playerStats,
        turns: state.turns,
        winnerId,
      });
      setConfettiKey(k => k + 1);
    }
  }, []);

  const handlePlayAgain = () => {
    if (!state.config) return;
    dispatch({ type: 'START_GAME', payload: state.config });
    navigation.replace('Game');
  };

  const handleNewGame = () => {
    dispatch({ type: 'RESET' });
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ConfettiAnimation key={confettiKey} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Title */}
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t.results.title}</Text>

        {/* Winner announcement */}
        <View style={styles.winnerCard}>
          {winnerStats ? (
            <>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.winnerName}>{winnerStats.name}</Text>
              <Text style={styles.winnerLabel}>{t.results.winner(winnerStats.name)}</Text>
              <View style={styles.winnerStatsRow}>
                <WinnerStat label="✅" value={winnerStats.correct} />
                <WinnerStat label="❌" value={winnerStats.fouls} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.trophy}>🤝</Text>
              <Text style={styles.winnerLabel}>{t.results.tie}</Text>
            </>
          )}
        </View>

        {/* Per-player stats table */}
        <Text style={[styles.tableTitle, isRTL && styles.rtlText]}>
          {t.results.stats.player}s
        </Text>
        {sortedPlayers.map((ps, i) => (
          <PlayerRow
            key={ps.id}
            stats={ps}
            rank={i + 1}
            isWinner={ps.id === winnerId}
            turns={state.turns}
            t={t}
            catLabel={(cat: Category) => t.game.categories[cat]}
            isRTL={isRTL}
            avatarColor={AVATAR_COLORS[
              state.config!.players.findIndex(p => p.id === ps.id) % AVATAR_COLORS.length
            ]}
          />
        ))}

        <Text style={styles.winningRule}>{t.results.winningRule}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
            <Text style={styles.primaryBtnText}>🔄 {t.results.playAgain}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleNewGame}>
            <Text style={styles.secondaryBtnText}>🏠 {t.results.newGame}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WinnerStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.winnerStat}>
      <Text style={styles.winnerStatLabel}>{label}</Text>
      <Text style={styles.winnerStatValue}>{value}</Text>
    </View>
  );
}

function PlayerRow({
  stats,
  rank,
  isWinner,
  turns,
  t,
  catLabel,
  isRTL,
  avatarColor,
}: {
  stats: PlayerStats;
  rank: number;
  isWinner: boolean;
  turns: any[];
  t: any;
  catLabel: (cat: Category) => string;
  isRTL: boolean;
  avatarColor: string;
}) {
  const avgMs = getAverageResponseTime(stats);
  const hardest = getHardestLetter(turns, stats.id);
  const bestCat = getBestCategory(stats);

  return (
    <View style={[styles.playerRow, isWinner && styles.playerRowWinner]}>
      {/* Rank + Avatar */}
      <View style={styles.playerRowLeft}>
        <Text style={styles.rank}>#{rank}</Text>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{stats.name.slice(0, 2).toUpperCase()}</Text>
          {isWinner && <Text style={styles.trophyBadge}>🏆</Text>}
        </View>
        <Text style={styles.playerName} numberOfLines={1}>{stats.name}</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCell label={t.results.stats.correct} value={String(stats.correct)} color="#16A34A" />
        <StatCell label={t.results.stats.fouls} value={String(stats.fouls)} color="#DC2626" />
        <StatCell
          label={t.results.stats.avgTime}
          value={avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : t.results.stats.none}
          color="#6B7280"
        />
        <StatCell
          label={t.results.stats.hardestLetter}
          value={hardest?.toUpperCase() ?? t.results.stats.none}
          color="#7C3AED"
        />
        <StatCell
          label={t.results.stats.bestCategory}
          value={bestCat ? catLabel(bestCat) : t.results.stats.none}
          color="#0891B2"
        />
      </View>
    </View>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  rtlText: { textAlign: 'right' },

  // Winner card
  winnerCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#F7B731',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trophy: { fontSize: 56 },
  winnerName: { fontSize: 28, fontWeight: '900', color: '#111827' },
  winnerLabel: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  winnerStatsRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
  winnerStat: { alignItems: 'center', gap: 2 },
  winnerStatLabel: { fontSize: 22 },
  winnerStatValue: { fontSize: 22, fontWeight: '800', color: '#374151' },

  // Player table
  tableTitle: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  playerRow: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  playerRowWinner: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9CA3AF',
    width: 26,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  trophyBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 14,
  },
  playerName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCell: {
    alignItems: 'center',
    minWidth: 60,
    gap: 2,
  },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },

  winningRule: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Actions
  actions: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: { color: '#374151', fontSize: 18, fontWeight: '700' },
});
