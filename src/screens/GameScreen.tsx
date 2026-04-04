import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useSpeechRecognition, speakText, stopSpeaking } from '../hooks/useSpeech';
import { useValidation } from '../hooks/useValidation';
import { randomTurn } from '../utils/randomPicker';
import { getRemainingWords } from '../utils/validation';
import { CircularTimer } from '../components/CircularTimer';
import { AnswerInput, shakeAnswerInput } from '../components/AnswerInput';
import { FeedbackOverlay } from '../components/FeedbackOverlay';
import { ConfettiAnimation } from '../components/ConfettiAnimation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

type Phase = 'announcing' | 'playing' | 'result';
type FeedbackType = 'correct' | 'timeout' | null;

const RESULT_DISPLAY_MS = 2200;
const ANNOUNCE_DELAY_MS = 600;

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

const CATEGORY_ICONS: Record<Category, string> = {
  animals:   '🐘',
  countries: '🌍',
  cities:    '🏙️',
  plants:    '🌿',
};

export function GameScreen({ navigation }: Props) {
  const { strings, settings, isRTL } = useAppSettings();
  const { state, dispatch, totalTurns, completedTurns } = useGame();
  const t = strings;

  const [phase, setPhase] = useState<Phase>('announcing');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackLabel, setFeedbackLabel] = useState('');
  const [correctWord, setCorrectWord] = useState('');
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);

  // Letter bounce animation
  const letterScale  = useRef(new Animated.Value(0)).current;
  const letterRotate = useRef(new Animated.Value(-20)).current;

  // Refs
  const phaseRef          = useRef<Phase>('announcing');
  const turnStartTimeRef  = useRef(0);
  const stateRef          = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const activeCategoryRef = useRef<Category | null>(null);
  const activeLetterRef   = useRef<string | null>(null);

  // Track what category+letter was last announced (to avoid repeating TTS)
  const lastAnnouncedRef  = useRef<string>('');

  const pendingTurnRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStartedRef     = useRef(false);
  const turnInProgressRef  = useRef(false);
  // Prevents double-submission (voice + timer firing simultaneously, or voice firing twice)
  const turnSubmittedRef   = useRef(false);

  const updatePhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const animateLetter = () => {
    letterScale.setValue(0);
    letterRotate.setValue(-20);
    Animated.parallel([
      Animated.spring(letterScale,  { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
      Animated.spring(letterRotate, { toValue: 0, useNativeDriver: true, tension: 150, friction: 8 }),
    ]).start();
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const { validate } = useValidation({
    category: activeCategoryRef.current,
    letter:   activeLetterRef.current,
    language: settings.language,
    usedWords: state.usedWords,
  });
  const validateRef = useRef(validate);
  useEffect(() => { validateRef.current = validate; }, [validate]);

  // ─── Speech ───────────────────────────────────────────────────────────────
  const speech = useSpeechRecognition({
    language: settings.language,
    onResult: useCallback((transcript: string) => {
      // Validate every voice result immediately — don't wait for isFinal
      // and never put voice results in the text field
      if (phaseRef.current !== 'playing') return;
      handleVoiceResult(transcript);
    }, []),
  });

  // ─── Timer ────────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (turnSubmittedRef.current) return;
    turnSubmittedRef.current = true;
    speech.stopListening();
    const elapsed = Date.now() - turnStartTimeRef.current;
    dispatch({ type: 'FOUL', payload: { reason: 'time_up', responseTime: elapsed } });
    showFeedbackAndAdvance('timeout', t.game.timeUp, false, '');
  }, [dispatch, t, speech]);

  const timer = useTimer({
    durationSeconds: state.config?.secondsPerTurn ?? 30,
    onExpire: handleTimeUp,
  });

  // ─── Guard + finish ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.config || state.status === 'idle') navigation.replace('Home');
    // Request mic permission immediately so it's ready before the first turn
    speech.preparePermissions();
  }, []);

  useEffect(() => {
    if (state.status === 'finished') {
      timer.stop();
      stopSpeaking();
      speech.stopListening();
      if (pendingTurnRef.current) { clearTimeout(pendingTurnRef.current); pendingTurnRef.current = null; }
      navigation.replace('Results');
    }
  }, [state.status]);

  // ─── Start a turn ─────────────────────────────────────────────────────────
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
      letter   = activeLetterRef.current;
    } else {
      const picked = randomTurn(
        currentState.config.language,
        currentState.config.selectedCategories?.length
          ? currentState.config.selectedCategories
          : undefined
      );
      category = picked.category;
      letter   = picked.letter;
      activeCategoryRef.current = category;
      activeLetterRef.current   = letter;
      dispatch({ type: 'BEGIN_TURN', payload: { category, letter } });
    }

    turnSubmittedRef.current = false; // reset guard for the new turn
    updatePhase('announcing');
    setFeedback(null);
    setCorrectWord('');
    timer.stop();
    stopSpeaking();
    animateLetter();

    // TTS: full announcement only when category+letter changed
    const turnKey = `${category}-${letter}`;
    const isNewTurn = lastAnnouncedRef.current !== turnKey;

    let announcement: string;
    if (isNewTurn) {
      const catLabel = t.game.categories[category];
      announcement = t.tts.yourTurn(player.name, catLabel, letter.toUpperCase());
      lastAnnouncedRef.current = turnKey;
    } else {
      // Same category+letter — just say the player name
      announcement = player.name;
    }

    const beginPlaying = () => {
      // Small extra buffer so mic doesn't catch the tail of TTS audio
      setTimeout(() => {
        turnInProgressRef.current = false;
        updatePhase('playing');
        turnStartTimeRef.current = Date.now();
        timer.start();
        speech.startListening(); // always call — no isAvailable check, hook handles it internally
      }, 400);
    };

    if (settings.ttsEnabled) {
      // Start mic ONLY after TTS is done — prevents mic from hearing the announcement
      speakText(announcement, settings.language, 'normal', beginPlaying);
    } else {
      const id = setTimeout(beginPlaying, ANNOUNCE_DELAY_MS);
      pendingTurnRef.current = id;
    }
  }, [settings, t, timer, dispatch, speech]);

  // ─── Kick off first turn ──────────────────────────────────────────────────
  useEffect(() => {
    if (state.status === 'playing' && !gameStartedRef.current) {
      gameStartedRef.current = true;
      startTurn(false, 0);
    }
  }, [state.status]);

  // ─── Show feedback then advance ───────────────────────────────────────────
  const showFeedbackAndAdvance = useCallback((
    type: FeedbackType,
    label: string,
    wasCorrect: boolean,
    word: string,
  ) => {
    updatePhase('result');
    setFeedback(type);
    setFeedbackLabel(label);
    setCorrectWord(word);
    if (type === 'timeout' && activeCategoryRef.current && activeLetterRef.current) {
      const words = getRemainingWords(
        activeCategoryRef.current,
        activeLetterRef.current,
        settings.language,
        stateRef.current.usedWords,
        20
      );
      setRemainingWords(words);
    } else {
      setRemainingWords([]);
    }
    stopSpeaking();
    timer.stop();
    speech.stopListening();

    const advanceAfterFeedback = () => {
      pendingTurnRef.current = null;
      setFeedback(null);
      setCorrectWord('');

      const { config, currentPlayerIndex, currentCycle } = stateRef.current;
      if (!config) return;

      const nextIdx    = (currentPlayerIndex + 1) % config.players.length;
      const nextCycle  = nextIdx === 0 ? currentCycle + 1 : currentCycle;
      const isGameOver = nextCycle > config.numberOfCycles;

      dispatch({ type: 'ADVANCE_TURN' });
      if (!isGameOver) startTurn(wasCorrect, nextIdx);
    };

    if (settings.ttsEnabled) {
      // Speak feedback TTS, then advance only after it finishes
      // so the next turn's TTS doesn't overlap with this one
      const feedbackText = wasCorrect
        ? `${t.tts.correct} ${word}`
        : t.tts.timeUp;
      const mood = wasCorrect ? 'excited' : 'sad';
      speakText(feedbackText, settings.language, mood, () => {
        const id = setTimeout(advanceAfterFeedback, 400);
        pendingTurnRef.current = id;
      });
    } else {
      const id = setTimeout(advanceAfterFeedback, RESULT_DISPLAY_MS);
      pendingTurnRef.current = id;
    }

    if (wasCorrect) setConfettiKey(k => k + 1);
  }, [settings, t, timer, speech, dispatch, startTurn]);

  // ─── Voice result handler ─────────────────────────────────────────────────
  // Splits transcript into individual words — if ANY word is correct, take it.
  const handleVoiceResult = useCallback((transcript: string) => {
    if (phaseRef.current !== 'playing') return;
    if (turnSubmittedRef.current) return; // guard against double-submission

    const tokens = transcript.trim().split(/\s+/).filter(Boolean);

    // Build candidates: multi-word phrases (up to 5 words) first, then single words.
    // This lets "United States" match before trying "United" alone.
    const candidates: string[] = [];
    for (let len = Math.min(tokens.length, 5); len >= 1; len--) {
      for (let start = 0; start <= tokens.length - len; start++) {
        candidates.push(tokens.slice(start, start + len).join(' '));
      }
    }

    for (const candidate of candidates) {
      const result = validateRef.current(candidate);
      if (result.valid) {
        turnSubmittedRef.current = true;
        timer.stop();
        speech.stopListening();
        const elapsed = Date.now() - turnStartTimeRef.current;
        dispatch({ type: 'CORRECT_ANSWER', payload: { answer: candidate, responseTime: elapsed } });
        showFeedbackAndAdvance('correct', t.game.correct, true, candidate);
        return;
      }
    }
  }, [timer, speech, dispatch, showFeedbackAndAdvance, t]);

  // ─── Typed answer handler ─────────────────────────────────────────────────
  const handleAnswer = useCallback((answer: string) => {
    if (phaseRef.current !== 'playing') return;
    if (turnSubmittedRef.current) return; // guard against double-submission

    const result = validateRef.current(answer);

    if (result.valid) {
      turnSubmittedRef.current = true;
      timer.stop();
      speech.stopListening();
      const elapsed = Date.now() - turnStartTimeRef.current;
      dispatch({ type: 'CORRECT_ANSWER', payload: { answer, responseTime: elapsed } });
      showFeedbackAndAdvance('correct', t.game.correct, true, answer);
    } else {
      shakeAnswerInput();
    }
  }, [timer, speech, dispatch, showFeedbackAndAdvance, t]);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => {
    timer.stop();
    stopSpeaking();
    speech.stopListening();
    if (pendingTurnRef.current) clearTimeout(pendingTurnRef.current);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!state.config) return null;

  const currentPlayerIndex = state.currentPlayerIndex;
  const currentPlayer      = state.config.players[currentPlayerIndex];
  const avatarColor        = AVATAR_COLORS[currentPlayerIndex % AVATAR_COLORS.length];
  const activeCategory     = activeCategoryRef.current;
  const categoryLabel      = activeCategory ? t.game.categories[activeCategory] : '...';
  const categoryIcon       = activeCategory ? CATEGORY_ICONS[activeCategory] : '🎯';
  const letterDisplay      = (activeLetterRef.current ?? '?').toUpperCase();
  const stats              = currentPlayer ? state.playerStats[currentPlayer.id] : null;
  const progressLabel      = t.game.round(state.currentCycle, state.config.numberOfCycles);
  const streak             = stats?.currentStreak ?? 0;

  const letterRotation = letterRotate.interpolate({ inputRange: [-20, 0], outputRange: ['-20deg', '0deg'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ConfettiAnimation key={confettiKey} />

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(completedTurns / totalTurns) * 100}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={styles.roundLabel}>{progressLabel}</Text>
          <View style={styles.statsRow}>
            {streak >= 2 && <Text style={styles.streakPill}>🔥 {streak}</Text>}
            <Text style={styles.scorePill}>✅ {stats?.correct ?? 0}</Text>
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
        <View style={[styles.challengeCard, { borderColor: avatarColor + '40' }]}>
          <View style={styles.challengeRow}>
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.category}</Text>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={styles.challengeValue}>{categoryLabel}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.challengeItem}>
              <Text style={styles.challengeMeta}>{t.game.letter}</Text>
              <Animated.Text
                style={[
                  styles.letterValue,
                  { color: avatarColor, transform: [{ scale: letterScale }, { rotate: letterRotation }] },
                ]}
              >
                {letterDisplay}
              </Animated.Text>
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

        {/* Announcing */}
        {phase === 'announcing' && currentPlayer && (
          <View style={[styles.announcingPill, { backgroundColor: avatarColor + '22', borderColor: avatarColor }]}>
            <Text style={[styles.announcingText, { color: avatarColor }]}>
              📢 {t.game.yourTurn(currentPlayer.name)}
            </Text>
          </View>
        )}

        {/* Input (always shown during playing) */}
        {phase === 'playing' && (
          <View style={styles.inputSection}>
            <AnswerInput
              onSubmit={handleAnswer}
              isListening={speech.isListening}
              isSpeechAvailable={speech.isAvailable}
              transcript={
                // Show only the last spoken word — not the whole accumulated phrase
                speech.transcript
                  ? speech.transcript.trim().split(/\s+/).pop() ?? ''
                  : ''
              }
              onStopListening={speech.stopListening}
              placeholder={t.game.speakOrType}
              submitLabel={t.game.submit}
              isRTL={isRTL}
            />
          </View>
        )}
      </View>

      <FeedbackOverlay
        feedback={feedback}
        label={feedbackLabel}
        streak={streak}
        correctWord={correctWord}
        remainingWords={remainingWords}
        letter={activeLetterRef.current ?? ''}
        isRTL={isRTL}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  progressBar: { height: 5, backgroundColor: '#E5E7EB' },
  progressFill: { height: 5, backgroundColor: '#6C63FF', borderRadius: 2 },
  container: { flex: 1, alignItems: 'center', padding: 20, gap: 16 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRTL: { flexDirection: 'row-reverse' },
  roundLabel: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  statsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  streakPill: {
    backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: '900',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 14, overflow: 'hidden',
  },
  scorePill: {
    backgroundColor: '#DCFCE7', color: '#166534', fontWeight: '700',
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 3, borderWidth: 2,
  },
  challengeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  challengeItem: { alignItems: 'center', flex: 1, gap: 2 },
  challengeMeta: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  categoryIcon: { fontSize: 28 },
  challengeValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  letterValue: { fontSize: 56, fontWeight: '900', lineHeight: 64 },
  divider: { width: 1, height: 70, backgroundColor: '#E5E7EB' },
  announcingPill: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1.5 },
  announcingText: { fontWeight: '700', fontSize: 16, textAlign: 'center' },
  inputSection: { width: '100%' },
});
