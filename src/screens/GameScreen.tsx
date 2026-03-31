import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
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
const ANNOUNCE_DELAY_MS = 500;

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

export function GameScreen({ navigation }: Props) {
  const { strings, settings, isRTL } = useAppSettings();
  const { state, dispatch, currentPlayer, totalTurns, completedTurns } = useGame();
  const t = strings;

  const [phase, setPhase] = useState<Phase>('announcing');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackLabel, setFeedbackLabel] = useState('');
  const [turnStartTime, setTurnStartTime] = useState(0);

  const turnRef = useRef({ category: '' as Category, letter: '' });

  // ─── Navigation guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.config || state.status === 'idle') {
      navigation.replace('Home');
    }
  }, [state.config, state.status]);

  useEffect(() => {
    if (state.status === 'finished') {
      navigation.replace('Results');
    }
  }, [state.status]);

  // ─── Timer ───────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (phase !== 'playing') return;
    const elapsed = Date.now() - turnStartTime;
    triggerFoul('time_up', undefined, elapsed);
  }, [phase, turnStartTime]);

  const timer = useTimer({
    durationSeconds: state.config?.secondsPerTurn ?? 30,
    onExpire: handleTimeUp,
  });

  // ─── Validation ──────────────────────────────────────────────────────────
  const { validate } = useValidation({
    category: state.currentCategory,
    letter: state.currentLetter,
    language: settings.language,
    usedWords: state.usedWords,
  });

  // ─── Speech Recognition ──────────────────────────────────────────────────
  const handleSpeechResult = useCallback(
    (transcript: string) => {
      if (phase === 'playing') handleAnswer(transcript);
    },
    [phase]
  );

  const speech = useSpeechRecognition({
    language: settings.language,
    onResult: handleSpeechResult,
  });

  // ─── Start a new turn ────────────────────────────────────────────────────
  const startTurn = useCallback(() => {
    if (!state.config) return;
    const { category, letter } = randomTurn(state.config.language);
    turnRef.current = { category, letter };
    dispatch({ type: 'BEGIN_TURN', payload: { category, letter } });

    setPhase('announcing');
    setFeedback(null);
    timer.reset();

    // TTS announcement
    const catLabel = t.game.categories[category];
    const announcement = t.tts.yourTurn(
      currentPlayer?.name ?? '',
      catLabel,
      letter.toUpperCase()
    );

    if (settings.ttsEnabled) {
      speakText(announcement, settings.language);
    }

    // Start timer after announcement
    const delay = settings.ttsEnabled ? 2500 : ANNOUNCE_DELAY_MS;
    setTimeout(() => {
      setPhase('playing');
      setTurnStartTime(Date.now());
      timer.start();
    }, delay);
  }, [state.config, currentPlayer, settings, t, timer, dispatch]);

  // ─── Kick off the first turn ─────────────────────────────────────────────
  useEffect(() => {
    if (state.status === 'playing' && state.currentCategory === null) {
      startTurn();
    }
  }, [state.status, state.currentCategory]);

  // ─── Handle answer ───────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== 'playing') return;
      timer.stop();
      speech.stopListening();
      stopSpeaking();

      const elapsed = Date.now() - turnStartTime;
      const result = validate(answer);

      if (result.valid) {
        dispatch({ type: 'CORRECT_ANSWER', payload: { answer, responseTime: elapsed } });
        showFeedback('correct', t.game.correct);
        haptic('success');
      } else {
        const reason = result.reason!;
        const label =
          reason === 'already_used'
            ? t.game.alreadyUsed
            : t.game.wrong;
        dispatch({ type: 'FOUL', payload: { reason, answer, responseTime: elapsed } });
        showFeedback('wrong', label);
        haptic('error');
      }
    },
    [phase, timer, speech, turnStartTime, validate, dispatch, t]
  );

  const triggerFoul = useCallback(
    (reason: 'time_up' | 'wrong_letter' | 'not_in_category' | 'already_used', answer: string | undefined, elapsed: number) => {
      timer.stop();
      speech.stopListening();
      stopSpeaking();

      const label = reason === 'time_up' ? t.game.timeUp : t.game.wrong;
      dispatch({ type: 'FOUL', payload: { reason, answer, responseTime: elapsed } });
      showFeedback(reason === 'time_up' ? 'timeout' : 'wrong', label);
      haptic('error');
    },
    [timer, speech, dispatch, t]
  );

  const showFeedback = (type: FeedbackType, label: string) => {
    setPhase('result');
    setFeedback(type);
    setFeedbackLabel(label);

    // TTS result
    if (settings.ttsEnabled) {
      speakText(type === 'correct' ? t.tts.correct : type === 'timeout' ? t.tts.timeUp : t.tts.wrong, settings.language);
    }

    setTimeout(() => {
      setFeedback(null);
      dispatch({ type: 'ADVANCE_TURN' });
    }, RESULT_DISPLAY_MS);
  };

  // Kick off next turn after ADVANCE_TURN
  useEffect(() => {
    if (
      state.status === 'playing' &&
      state.currentCategory === null &&
      phase === 'result'
    ) {
      startTurn();
    }
  }, [state.currentCategory, state.status]);

  // ─── Haptics ─────────────────────────────────────────────────────────────
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

  // ─── Derived UI values ───────────────────────────────────────────────────
  if (!state.config || !currentPlayer) return null;

  const playerIndex = state.config.players.findIndex(p => p.id === currentPlayer.id);
  const avatarColor = AVATAR_COLORS[playerIndex % AVATAR_COLORS.length];
  const categoryLabel = state.currentCategory
    ? t.game.categories[state.currentCategory]
    : '...';
  const letterDisplay = state.currentLetter?.toUpperCase() ?? '?';
  const stats = state.playerStats[currentPlayer.id];
  const progressLabel = t.game.round(state.currentCycle, state.config.numberOfCycles);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(completedTurns / totalTurns) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.container}>
        {/* Top: round / player info */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={styles.roundLabel}>{progressLabel}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.scorePill}>✅ {stats?.correct ?? 0}</Text>
            <Text style={styles.foulPill}>❌ {stats?.fouls ?? 0}</Text>
          </View>
        </View>

        {/* Player avatar + name */}
        <View style={styles.playerSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {currentPlayer.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          {phase === 'announcing' && (
            <Text style={styles.turnLabel}>{t.game.yourTurn(currentPlayer.name)}</Text>
          )}
        </View>

        {/* Category & Letter card */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeRow}>
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.category}</Text>
              <Text style={styles.challengeValue}>{categoryLabel}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.letter}</Text>
              <Text style={[styles.letterValue, { color: avatarColor }]}>
                {letterDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Timer */}
        {phase === 'playing' && (
          <CircularTimer
            secondsLeft={timer.secondsLeft}
            progress={timer.progress}
            totalSeconds={state.config.secondsPerTurn}
            size={150}
          />
        )}

        {phase === 'announcing' && (
          <View style={styles.announcingPill}>
            <Text style={styles.announcingText}>📢 {t.game.yourTurn(currentPlayer.name)}</Text>
          </View>
        )}

        {/* Answer input */}
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

      {/* Feedback flash overlay */}
      <FeedbackOverlay feedback={feedback} label={feedbackLabel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  roundLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scorePill: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 14,
    overflow: 'hidden',
  },
  foulPill: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 14,
    overflow: 'hidden',
  },
  playerSection: {
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 28,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  turnLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  challengeCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  challengeItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  challengeMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  challengeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  letterValue: {
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 60,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  announcingPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  announcingText: {
    color: '#6C63FF',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
  },
});
