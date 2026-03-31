import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GameConfig, PlayerConfig } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';
import { generateId } from '../utils/randomPicker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'>;
};

const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#A55EEA', '#FD9644', '#2BCBBA',
];

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  isRTL,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  isRTL?: boolean;
  suffix?: string;
}) {
  return (
    <View style={styles.stepperContainer}>
      <Text style={[styles.stepperLabel, isRTL && styles.rtlText]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>
          {value}{suffix}
        </Text>
        <TouchableOpacity
          style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SetupScreen({ navigation }: Props) {
  const { strings, settings, isRTL } = useAppSettings();
  const { dispatch } = useGame();
  const t = strings;

  const [numPlayers, setNumPlayers] = useState(2);
  const [secondsPerTurn, setSecondsPerTurn] = useState(30);
  const [numberOfCycles, setNumberOfCycles] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => '')
  );

  const updateName = (index: number, name: string) => {
    setPlayerNames(prev => {
      const copy = [...prev];
      copy[index] = name;
      return copy;
    });
  };

  const handleStart = () => {
    // Validate player names
    const names = playerNames.slice(0, numPlayers);
    const filled = names.map((n, i) => n.trim() || `${t.setup.playerName(i + 1)}`);

    const players: PlayerConfig[] = filled.map((name, i) => ({
      id: generateId(),
      name,
    }));

    const config: GameConfig = {
      language: settings.language,
      players,
      secondsPerTurn,
      numberOfCycles,
    };

    dispatch({ type: 'START_GAME', payload: config });
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t.setup.title}</Text>

        {/* Number of players */}
        <Stepper
          label={t.setup.numberOfPlayers}
          value={numPlayers}
          min={2}
          max={8}
          onChange={v => setNumPlayers(v)}
          isRTL={isRTL}
        />

        {/* Seconds per turn */}
        <Stepper
          label={t.setup.secondsPerTurn}
          value={secondsPerTurn}
          min={10}
          max={60}
          step={5}
          suffix="s"
          onChange={v => setSecondsPerTurn(v)}
          isRTL={isRTL}
        />

        {/* Number of rounds */}
        <Stepper
          label={t.setup.numberOfCycles}
          value={numberOfCycles}
          min={1}
          max={10}
          onChange={v => setNumberOfCycles(v)}
          isRTL={isRTL}
        />

        {/* Player names */}
        <Text style={[styles.sectionHeader, isRTL && styles.rtlText]}>
          {t.setup.playersHeader}
        </Text>

        {Array.from({ length: numPlayers }).map((_, i) => (
          <View key={i} style={[styles.playerRow, isRTL && styles.playerRowRTL]}>
            <View style={[styles.playerAvatar, { backgroundColor: AVATAR_COLORS[i] }]}>
              <Text style={styles.playerAvatarText}>{i + 1}</Text>
            </View>
            <TextInput
              style={[styles.playerInput, isRTL && styles.rtlText]}
              value={playerNames[i]}
              onChangeText={v => updateName(i, v)}
              placeholder={t.setup.playerName(i + 1)}
              placeholderTextColor="#9CA3AF"
              maxLength={20}
              returnKeyType="next"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        ))}

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{t.setup.startGame}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 24,
    gap: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  rtlText: {
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 8,
  },
  // Stepper
  stepperContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    minWidth: 60,
    textAlign: 'center',
  },
  // Player rows
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerRowRTL: {
    flexDirection: 'row-reverse',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  playerInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Start button
  startBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
});
