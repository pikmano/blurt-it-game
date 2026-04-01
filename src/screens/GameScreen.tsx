import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Vibration,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useSpeechRecognition, speakText, stopSpeaking } from '../hooks/useSpeech';
import { useValidation } from '../hooks/useValidation';
import { randomTurn } from '../utils/randomPicker';
import { CircularTimer } from '../components/CircularTimer';
import { AnswerInput } from '../components/AnswerInput';
import { FeedbackOverlay } from '../components/FeedbackOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

type Phase = 'announcing' | 'playing' | 'result';
type FeedbackType = 'correct' | 'wrong' | 'timeout' | null;

const RESULT_DISPLAY_MS = 1600;
const ANNOUNCE_DELAY_MS = 600;

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

export function GameScreen({ navigation }: Props) {
  const { strings, settings, isRTL } = useAppSettings();
  const { state, dispatch, totalTurns, completedTurns } = useGame();
  const t = strings;

  const [phase, setPhase] = useState<Phase>('announcing');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackLabel, setFeedbackLabel] = useState('');

  // Refs for values needed inside async callbacks (avoids stale closures)
  const phaseRef = useRef<Phase>('announcing');
  const turnStartTimeRef = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Current category/letter tracked locally so we can reuse on correct answer
  const activeCategoryRef = useRef<Category | null>(null);
  const activeLetterRef = useRef<string | null>(null);

  // Guard against double-firing startTurn in the same cycle
  const turnInProgressRef = useRef(false);
  // Prevent multiple pending setTimeout chains
  const pendingTurnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // ─── Guard: bail if state is wrong ────────────────────────────────────────
  useEffect(() => {
    if (!state.config || state.status === 'idle') navigation.replace('Home');
  }, []);

  // ─── Stop everything when game finishes ───────────────────────────────────
  useEffect(() => {
    if (state.status === 'finished') {
      timer.stop();
      stopSpeaking();
      if (pendingTurnRef.current) {
        clearTimeout(pendingTurnRef.current);
        pendingTurnRef.current = null;
      }
      navigation.replace('Results');
    }
  }, [state.status]);

  // ─── Timer ────────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const elapsed = Date.now() - turnStartTimeRef.current;
    dispatch({ type: 'FOUL', payload: { reason: 'time_up', responseTime: elapsed } });
    showFeedbackAndAdvance('timeout', t.game.timeUp, false);
    haptic('error');
  }, [dispatch, t]);

  const timer = useTimer({
    durationSeconds: state.config?.secondsPerTurn ?? 30,
    onExpire: handleTimeUp,
  });

  // ─── Validation ───────────────────────────────────────────────────────────
  const { validate } = useValidation({
    category: activeCategoryRef.current,
    letter: activeLetterRef.current,
    language: settings.language,
    usedWords: state.usedWords,
  });

  // ─── Speech ───────────────────────────────────────────────────────────────
  const speech = useSpeechRecognition({
    language: settings.language,
    onResult: (transcript) => {
      if (phaseRef.current === 'playing') handleAnswer(transcript);
    },
  });

  // ─── Core: start a turn ───────────────────────────────────────────────────
  /**
   * @param keepCurrentTurn  true  = same letter/category (after correct answer)
   *                         false = pick a new one (after foul / first turn)
   * @param playerIndex      Which player's turn this is. Pass explicitly so we
   *                         don't depend on React state that may not have updated
   *                         yet after ADVANCE_TURN was dispatched.
   */
  const startTurn = useCallback((keepCurrentTurn: boolean, playerIndex: number) => {
    const currentState = stateRef.current;
    if (!currentState.config) return;
    if (turnInProgressRef.current) return;
    turnInProgressRef.current = true;

    const player = currentState.config.players[playerIndex];

    let category: Category;
    let letter: string;

    if (keepCurrentTurn && activeCategoryRef.current && activeLetterRef.current) {
      category = activeCategoryRef.current;
      letter = activeLetterRef.current;
    } else {
      const picked = randomTurn(currentState.config.language);
      category = picked.category;
      letter = picked.letter;
      activeCategoryRef.current = category;
      activeLetterRef.current = letter;
      dispatch({ type: 'BEGIN_TURN', payload: { category, letter } });
    }

    updatePhase('announcing');
    setFeedback(null);
    timer.stop();

    const catLabel = t.game.categories[category];
    const announcement = t.tts.yourTurn(player.name, catLabel, letter.toUpperCase());
    if (settings.ttsEnabled) speakText(announcement, settings.language);

    const delay = settings.ttsEnabled ? 2500 : ANNOUNCE_DELAY_MS;
    const id = setTimeout(() => {
      pendingTurnRef.current = null;
      turnInProgressRef.current = false;
      updatePhase('playing');
      turnStartTimeRef.current = Date.now();
      timer.start();
    }, delay);
    pendingTurnRef.current = id;
  }, [settings, t, timer, dispatch]);

  // ─── Kick off first turn on game start ────────────────────────────────────
  const gameStartedRef = useRef(false);
  useEffect(() => {
    if (state.status === 'playing' && !gameStartedRef.current) {
      gameStartedRef.current = true;
      startTurn(false, 0);
    }
  }, [state.status]);

  // ─── Show feedback, advance turn, then start next turn ────────────────────
  const showFeedbackAndAdvance = useCallback((
    type: FeedbackType,
    label: string,
    wasCorrect: boolean,
  ) => {
    updatePhase('result');
    setFeedback(type);
    setFeedbackLabel(label);
    stopSpeaking();
    timer.stop();

    if (settings.ttsEnabled) {
      const mood = type === 'correct' ? 'excited' : 'sad';
      speakText(
        type === 'correct' ? t.tts.correct : type === 'timeout' ? t.tts.timeUp : t.tts.wrong,
        settings.language,
        mood,
      );
    }

    const id = setTimeout(() => {
      pendingTurnRef.current = null;
      setFeedback(null);

      // Read latest state from ref — this is safe inside a timeout
      const { config, currentPlayerIndex, currentCycle } = stateRef.current;
      if (!config) return;

      // Calculate next player BEFORE dispatching so we have the correct name
      const numPlayers = config.players.length;
      const nextIdx = (currentPlayerIndex + 1) % numPlayers;
      const nextCycle = nextIdx === 0 ? currentCycle + 1 : currentCycle;
      const isGameOver = nextCycle > config.numberOfCycles;

      dispatch({ type: 'ADVANCE_TURN' });

      if (!isGameOver) {
        startTurn(wasCorrect, nextIdx);
      }
      // If isGameOver, the useEffect watching state.status handles navigation
    }, RESULT_DISPLAY_MS);
    pendingTurnRef.current = id;
  }, [settings, t, timer, dispatch, startTurn]);

  // ─── Answer handler ───────────────────────────────────────────────────────
  const handleAnswer = useCallback((answer: string) => {
    if (phaseRef.current !== 'playing') return;
    timer.stop();
    speech.stopListening();

    const elapsed = Date.now() - turnStartTimeRef.current;
    const result = validate(answer);

    if (result.valid) {
      dispatch({ type: 'CORRECT_ANSWER', payload: { answer, responseTime: elapsed } });
      showFeedbackAndAdvance('correct', t.game.correct, true);
      haptic('success');
    } else {
      const reason = result.reason!;
      const label = reason === 'already_used' ? t.game.alreadyUsed : t.game.wrong;
      dispatch({ type: 'FOUL', payload: { reason, answer, responseTime: elapsed } });
      showFeedbackAndAdvance('wrong', label, false);
      haptic('error');
    }
  }, [timer, speech, validate, dispatch, showFeedbackAndAdvance, t]);

  // ─── Haptics ──────────────────────────────────────────────────────────────
  const haptic = (type: 'success' | 'error') => {
    if (!settings.soundEnabled) return;
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );
    } else {
      Vibration.vibrate(type === 'success' ? 50 : [0, 80, 50, 80]);
    }
  };

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => {
    timer.stop();
    stopSpeaking();
    if (pendingTurnRef.current) clearTimeout(pendingTurnRef.current);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!state.config) return null;

  const currentPlayerIndex = state.currentPlayerIndex;
  const currentPlayer = state.config.players[currentPlayerIndex];
  const avatarColor = AVATAR_COLORS[currentPlayerIndex % AVATAR_COLORS.length];
  const categoryLabel = activeCategoryRef.current ? t.game.categories[activeCategoryRef.current] : '...';
  const letterDisplay = (activeLetterRef.current ?? '?').toUpperCase();
  const stats = currentPlayer ? state.playerStats[currentPlayer.id] : null;
  const progressLabel = t.game.round(state.currentCycle, state.config.numberOfCycles);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(completedTurns / totalTurns) * 100}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={styles.roundLabel}>{progressLabel}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.scorePill}>✅ {stats?.correct ?? 0}</Text>
            <Text style={styles.foulPill}>❌ {stats?.fouls ?? 0}</Text>
          </View>
        </View>

        {/* Player */}
        {currentPlayer && (
          <View style={styles.playerSection}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{currentPlayer.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{currentPlayer.name}</Text>
          </View>
        )}

        {/* Category & Letter */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeRow}>
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.category}</Text>
              <Text style={styles.challengeValue}>{categoryLabel}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.letter}</Text>
              <Text style={[styles.letterValue, { color: avatarColor }]}>{letterDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Timer / announcing pill */}
        {phase === 'playing' && (
          <CircularTimer
            secondsLeft={timer.secondsLeft}
            progress={timer.progress}
            totalSeconds={state.config.secondsPerTurn}
            size={150}
          />
        )}
        {phase === 'announcing' && currentPlayer && (
          <View style={styles.announcingPill}>
            <Text style={styles.announcingText}>📢 {t.game.yourTurn(currentPlayer.name)}</Text>
          </View>
        )}

        {/* Input */}
        {phase === 'playing' && (
          <View style={styles.inputSection}>
            <AnswerInput
              onSubmit={handleAnswer}
              isListening={speech.isListening}
              isSpeechAvailable={speech.isAvailable}
              transcript={speech.transcript}
              onStartListening={speech.startListening}
              onStopListening={speech.stopListening}
              placeholder={t.game.speakOrType}
              submitLabel={t.game.submit}
              tapToSpeakLabel={t.game.tapToSpeak}
              stopLabel={t.game.stopListening}
              tapToTypeLabel={t.game.tapToType}
              isRTL={isRTL}
            />
          </View>
        )}
      </View>

      <FeedbackOverlay feedback={feedback} label={feedbackLabel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB' },
  progressFill: { height: 4, backgroundColor: '#6C63FF', borderRadius: 2 },
  container: { flex: 1, alignItems: 'center', padding: 20, gap: 20 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRTL: { flexDirection: 'row-reverse' },
  roundLabel: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  statsRow: { flexDirection: 'row', gap: 8 },
  scorePill: {
    backgroundColor: '#DCFCE7', color: '#166534', fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 14, overflow: 'hidden',
  },
  foulPill: {
    backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 14, overflow: 'hidden',
  },
  playerSection: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 28 },
  playerName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  challengeCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  challengeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  challengeItem: { alignItems: 'center', flex: 1, gap: 4 },
  challengeMeta: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  challengeValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  letterValue: { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  divider: { width: 1, height: 60, backgroundColor: '#E5E7EB' },
  announcingPill: { backgroundColor: '#EEF2FF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 },
  announcingText: { color: '#6C63FF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  inputSection: { width: '100%' },
});
