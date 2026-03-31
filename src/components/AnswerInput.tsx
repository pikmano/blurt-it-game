import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isListening: boolean;
  isSpeechAvailable: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  placeholder?: string;
  submitLabel?: string;
  tapToSpeakLabel?: string;
  stopLabel?: string;
  tapToTypeLabel?: string;
  isRTL?: boolean;
  disabled?: boolean;
}

/**
 * Combined voice + text input component.
 * Shows a mic button (if speech is available) and a text field.
 */
export function AnswerInput({
  onSubmit,
  isListening,
  isSpeechAvailable,
  transcript,
  onStartListening,
  onStopListening,
  placeholder = 'Type your answer...',
  submitLabel = 'Submit',
  tapToSpeakLabel = 'Tap to Speak',
  stopLabel = 'Stop',
  tapToTypeLabel = 'Type instead',
  isRTL = false,
  disabled = false,
}: AnswerInputProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'voice' | 'text'>(
    isSpeechAvailable ? 'voice' : 'text'
  );
  const inputRef = useRef<TextInput>(null);

  // Keep text input synced with live transcript
  React.useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const handleSubmit = () => {
    const answer = text.trim();
    if (!answer) return;
    onSubmit(answer);
    setText('');
  };

  const handleMicPress = () => {
    if (isListening) {
      onStopListening();
    } else {
      setText('');
      onStartListening();
    }
  };

  return (
    <View style={styles.container}>
      {/* Voice mode mic button */}
      {mode === 'voice' && isSpeechAvailable && (
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={handleMicPress}
          disabled={disabled}
          activeOpacity={0.75}
        >
          {isListening ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.micIcon}>🎤</Text>
          )}
          <Text style={styles.micLabel}>
            {isListening ? stopLabel : tapToSpeakLabel}
          </Text>
        </TouchableOpacity>
      )}

      {/* Transcript / text preview while listening */}
      {isListening && transcript ? (
        <Text style={styles.transcript}>{transcript}</Text>
      ) : null}

      {/* Text input row */}
      {mode === 'text' || !isSpeechAvailable ? (
        <View style={[styles.row, isRTL && styles.rowRTL]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, isRTL && styles.inputRTL]}
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
            style={[styles.submitBtn, !text.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={disabled || !text.trim()}
          >
            <Text style={styles.submitLabel}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Mode toggle */}
      {isSpeechAvailable && (
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => {
            setMode(m => (m === 'voice' ? 'text' : 'voice'));
            if (isListening) onStopListening();
          }}
          disabled={disabled}
        >
          <Text style={styles.toggleLabel}>
            {mode === 'voice' ? tapToTypeLabel : '🎤 Use voice'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit from voice transcript */}
      {mode === 'voice' && !isListening && text.trim() ? (
        <View style={[styles.row, styles.rowCentered]}>
          <Text style={styles.transcript}>{text}</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={disabled}>
            <Text style={styles.submitLabel}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micIcon: {
    fontSize: 40,
  },
  micLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  transcript: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    paddingHorizontal: 16,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rowCentered: {
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  inputRTL: {
    textAlign: 'right',
  },
  submitBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  toggle: {
    padding: 8,
  },
  toggleLabel: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 14,
  },
});
