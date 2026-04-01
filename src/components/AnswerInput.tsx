import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isListening: boolean;
  isSpeechAvailable: boolean;
  transcript: string;           // live interim transcript from voice
  onStopListening: () => void;
  placeholder?: string;
  submitLabel?: string;
  isRTL?: boolean;
  disabled?: boolean;
  onWrongAnswer?: () => void;   // called by parent to trigger shake
}

export function AnswerInput({
  onSubmit,
  isListening,
  isSpeechAvailable,
  transcript,
  onStopListening,
  placeholder = 'Type your answer...',
  submitLabel = 'Submit',
  isRTL = false,
  disabled = false,
}: AnswerInputProps) {
  const [text, setText] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef  = useRef<TextInput>(null);

  // Voice transcript is handled directly in GameScreen — never put in text field
  // The text field is for manual typing only

  // Expose shake trigger via ref so parent can call it
  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start(() => setText(''));
  };

  // Allow parent to trigger shake by calling the exported ref
  ;(AnswerInput as any)._shake = shake;

  const handleSubmit = () => {
    const answer = text.trim();
    if (!answer || disabled) return;
    onSubmit(answer);
    // Don't clear here — parent decides (correct → new turn, wrong → shake+clear)
  };

  return (
    <View style={styles.container}>
      {/* Listening indicator */}
      {isSpeechAvailable && (
        <ListeningBadge isListening={isListening} />
      )}

      {/* Live voice transcript preview (read-only) */}
      {isListening && transcript ? (
        <Text style={styles.transcriptPreview}>{transcript}</Text>
      ) : null}

      {/* Text input row */}
      <Animated.View style={[styles.row, isRTL && styles.rowRTL, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isRTL && styles.inputRTL, isListening && styles.inputListening]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          autoCorrect={false}
          autoCapitalize="none"
          editable={!disabled}
          textAlign={isRTL ? 'right' : 'left'}
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!text.trim() || disabled) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Shake trigger helper — called from GameScreen
export function shakeAnswerInput() {
  (AnswerInput as any)._shake?.();
}

// ─── Listening badge ──────────────────────────────────────────────────────────

function ListeningBadge({ isListening }: { isListening: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0,  duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isListening]);

  return (
    <View style={styles.badgeRow}>
      <Animated.View style={[
        styles.micDot,
        { transform: [{ scale: pulse }] },
        isListening ? styles.micDotActive : styles.micDotIdle,
      ]} />
      <Text style={[styles.badgeText, !isListening && styles.badgeTextIdle]}>
        {isListening ? '🎤  Listening...' : '🎤  Mic ready'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micDot: { width: 10, height: 10, borderRadius: 5 },
  micDotActive: { backgroundColor: '#EF4444' },
  micDotIdle:   { backgroundColor: '#9CA3AF' },
  badgeText:     { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  badgeTextIdle: { color: '#9CA3AF' },
  transcriptPreview: {
    fontSize: 16, fontWeight: '600', color: '#6B7280',
    textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20,
  },
  row: { flexDirection: 'row', width: '100%', gap: 8, paddingHorizontal: 16 },
  rowRTL: { flexDirection: 'row-reverse' },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: '#111827',
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  inputListening: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  inputRTL: { textAlign: 'right' },
  submitBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 20,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
