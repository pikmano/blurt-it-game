import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export function ResultsScreen({ navigation }: Props) {
  const { strings, isRTL } = useAppSettings();
  const { state, dispatch } = useGame();
  const t = strings;
  const [saved, setSaved] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // Entrance animations
  const titleAnim  = useRef(new Animated.Value(-60)).current;
  const titleOp    = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(80)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const tableAnim  = useRef(new Animated.Value(60)).current;
  const tableOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.spring(titleAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(titleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(cardOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(tableAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(tableOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!state.config) {
    navigation.replace('Home');
    return null;
  }

  const winnerId = getWinner(state.playerStats);
  const winnerStats = winnerId ? state.playerStats[winnerId] : null;

  const sortedPlayers = Object.values(state.playerStats).sort((a, b) => {
    if (a.fouls !== b.fouls) return a.fouls - b.fouls;
    return b.correct - a.correct;
  });

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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Animated.Text
          style={[styles.title, isRTL && styles.rtlText,
            { transform: [{ translateY: titleAnim }], opacity: titleOp }]}
        >
          {t.results.title}
        </Animated.Text>

        {/* Winner card */}
        <Animated.View
          style={[styles.winnerCard, { transform: [{ translateY: cardAnim }], opacity: cardOp }]}
        >
          {winnerStats ? (
            <>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.winnerName}>{winnerStats.name}</Text>
              <Text style={styles.winnerSubtitle}>{t.results.winner(winnerStats.name)}</Text>
              <View style={styles.winnerChips}>
                <WinnerChip icon="✅" value={winnerStats.correct} label={t.results.stats.correct} color="#16A34A" />
                <WinnerChip icon="❌" value={winnerStats.fouls} label={t.results.stats.fouls} color="#DC2626" />
                {winnerStats.maxStreak >= 2 && (
                  <WinnerChip icon="🔥" value={winnerStats.maxStreak} label="Best Streak" color="#D97706" />
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.trophy}>🤝</Text>
              <Text style={styles.winnerSubtitle}>{t.results.tie}</Text>
            </>
          )}
        </Animated.View>

        {/* Podium (top 3) */}
        {sortedPlayers.length > 1 && (
          <Animated.View style={[styles.podiumRow, { opacity: tableOp }]}>
            {sortedPlayers.slice(0, Math.min(3, sortedPlayers.length)).map((ps, i) => {
              const color = AVATAR_COLORS[
                state.config!.players.findIndex(p => p.id === ps.id) % AVATAR_COLORS.length
              ];
              const heights = [90, 70, 55];
              return (
                <View key={ps.id} style={styles.podiumItem}>
                  <Text style={styles.podiumMedal}>{RANK_MEDALS[i] ?? `#${i + 1}`}</Text>
                  <View style={[styles.podiumAvatar, { backgroundColor: color }]}>
                    <Text style={styles.podiumAvatarText}>{ps.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{ps.name}</Text>
                  <View style={[styles.podiumBar, { height: heights[i] ?? 40, backgroundColor: color + 'cc' }]}>
                    <Text style={styles.podiumScore}>{ps.correct - ps.fouls}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Player stats */}
        <Animated.View style={{ width: '100%', gap: 12, opacity: tableOp, transform: [{ translateY: tableAnim }] }}>
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
        </Animated.View>

        <Text style={styles.winningRule}>{t.results.winningRule}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>🔄  {t.results.playAgain}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleNewGame} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>🏠  {t.results.newGame}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function WinnerChip({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={[styles.winnerChip, { borderColor: color + '60', backgroundColor: color + '18' }]}>
      <Text style={styles.winnerChipIcon}>{icon}</Text>
      <Text style={[styles.winnerChipValue, { color }]}>{value}</Text>
      <Text style={styles.winnerChipLabel}>{label}</Text>
    </View>
  );
}

function PlayerRow({
  stats, rank, isWinner, turns, t, catLabel, isRTL, avatarColor,
}: {
  stats: PlayerStats; rank: number; isWinner: boolean; turns: any[];
  t: any; catLabel: (cat: Category) => string; isRTL: boolean; avatarColor: string;
}) {
  const avgMs = getAverageResponseTime(stats);
  const hardest = getHardestLetter(turns, stats.id);
  const bestCat = getBestCategory(stats);

  return (
    <View style={[styles.playerRow, isWinner && { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }]}>
      <View style={styles.playerRowHeader}>
        <View style={styles.playerRowLeft}>
          <Text style={styles.rankMedal}>{RANK_MEDALS[rank - 1] ?? `#${rank}`}</Text>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{stats.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>{stats.name}</Text>
        </View>
        <View style={styles.playerScoreRow}>
          <Text style={styles.playerCorrect}>✅ {stats.correct}</Text>
          <Text style={styles.playerFouls}>❌ {stats.fouls}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCell label={t.results.stats.avgTime} value={avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : '—'} color="#6B7280" />
        <StatCell label={t.results.stats.hardestLetter} value={hardest?.toUpperCase() ?? '—'} color="#7C3AED" />
        <StatCell label={t.results.stats.bestCategory} value={bestCat ? catLabel(bestCat) : '—'} color="#0891B2" />
        {stats.maxStreak >= 2 && (
          <StatCell label="Best Streak" value={`🔥 ${stats.maxStreak}`} color="#D97706" />
        )}
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
  container: { padding: 20, gap: 20, paddingBottom: 60, alignItems: 'center' },

  title: { fontSize: 34, fontWeight: '900', color: '#111827', textAlign: 'center' },
  rtlText: { textAlign: 'right' },

  winnerCard: {
    width: '100%', backgroundColor: '#FFFBEB', borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#FCD34D',
    shadowColor: '#F7B731', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  trophy: { fontSize: 64 },
  winnerName: { fontSize: 30, fontWeight: '900', color: '#111827' },
  winnerSubtitle: { fontSize: 17, fontWeight: '700', color: '#92400E' },
  winnerChips: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  winnerChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5, gap: 2 },
  winnerChipIcon: { fontSize: 20 },
  winnerChipValue: { fontSize: 22, fontWeight: '900' },
  winnerChipLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  // Podium
  podiumRow: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', gap: 12, paddingHorizontal: 10,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  podiumMedal: { fontSize: 28 },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  podiumAvatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  podiumName: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumScore: { color: '#fff', fontWeight: '900', fontSize: 18 },

  // Player rows
  playerRow: {
    width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 16,
    gap: 12, borderWidth: 2, borderColor: '#E5E7EB',
  },
  playerRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rankMedal: { fontSize: 22, width: 30 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  playerName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  playerScoreRow: { flexDirection: 'row', gap: 8 },
  playerCorrect: { fontSize: 14, fontWeight: '800', color: '#16A34A', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  playerFouls: { fontSize: 14, fontWeight: '800', color: '#DC2626', backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCell: { alignItems: 'center', minWidth: 64, gap: 2 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },

  winningRule: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },

  actions: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  secondaryBtn: {
    backgroundColor: '#F3F4F6', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB',
  },
  secondaryBtnText: { color: '#374151', fontSize: 17, fontWeight: '700' },
});
