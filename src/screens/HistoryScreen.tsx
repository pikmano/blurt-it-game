import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GameResult } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { loadGameHistory, clearGameHistory } from '../utils/storage';
import { getWinner } from '../utils/stats';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function GameResultCard({ result, t }: { result: GameResult; t: any }) {
  const winnerId = getWinner(result.playerStats);
  const winnerName = winnerId
    ? result.playerStats[winnerId]?.name
    : t.history.tie;

  const players = result.config.players.map(p => p.name).join(', ');

  return (
    <View style={styles.card}>
      {/* Date */}
      <Text style={styles.cardDate}>{formatDate(result.date)}</Text>

      {/* Players */}
      <Text style={styles.cardPlayers} numberOfLines={1}>
        👥 {players}
      </Text>

      {/* Winner */}
      <View style={styles.winnerRow}>
        <Text style={styles.winnerLabel}>🏆 {t.history.winner}:</Text>
        <Text style={styles.winnerName}>{winnerName ?? t.history.tie}</Text>
      </View>

      {/* Per-player summary */}
      <View style={styles.statsRow}>
        {result.config.players.map(player => {
          const ps = result.playerStats[player.id];
          if (!ps) return null;
          return (
            <View key={player.id} style={styles.playerStat}>
              <Text style={styles.playerStatName} numberOfLines={1}>{player.name}</Text>
              <Text style={styles.playerStatDetail}>✅{ps.correct} ❌{ps.fouls}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const { strings, isRTL } = useAppSettings();
  const t = strings;
  const [history, setHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameHistory().then(h => {
      setHistory(h);
      setLoading(false);
    });
  }, []);

  const handleClear = () => {
    Alert.alert(
      t.history.deleteAll,
      '',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.ok,
          style: 'destructive',
          onPress: async () => {
            await clearGameHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t.history.title}</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>{t.history.deleteAll}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? null : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
            {t.history.noHistory}
          </Text>
          <TouchableOpacity
            style={styles.newGameBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.newGameBtnText}>🎮 {t.home.newGame}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <GameResultCard result={item} t={t} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRTL: { flexDirection: 'row-reverse' },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  rtlText: { textAlign: 'right' },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  cardPlayers: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  winnerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  playerStat: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  playerStatName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    maxWidth: 80,
  },
  playerStatDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  emptyIcon: { fontSize: 64 },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  newGameBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  newGameBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
});
