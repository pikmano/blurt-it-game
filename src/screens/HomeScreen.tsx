import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Switch,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width, height } = Dimensions.get('window');


const BLOBS = [
  { x: -60, y: -40, size: 220, color: '#6C63FF', opacity: 0.55 },
  { x: width - 120, y: 60, size: 180, color: '#FF6584', opacity: 0.45 },
  { x: 30, y: height * 0.45, size: 160, color: '#43BCCD', opacity: 0.35 },
  { x: width - 80, y: height * 0.6, size: 200, color: '#F7B731', opacity: 0.3 },
  { x: width * 0.3, y: height * 0.8, size: 150, color: '#A55EEA', opacity: 0.4 },
];

export function HomeScreen({ navigation }: Props) {
  const { strings, settings, isRTL, setLanguage, setSoundEnabled, setTtsEnabled } =
    useAppSettings();
  const { dispatch } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const t = strings;

  // Pulse animation for the logo
  const pulse = useRef(new Animated.Value(1)).current;
  // Slow drift for blobs
  const blobDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobDrift, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(blobDrift, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const blobY = blobDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  const handleNewGame = () => {
    dispatch({ type: 'RESET' });
    navigation.navigate('Setup');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BLOBS.map((b, i) => (
          <Animated.View
            key={i}
            style={[
              styles.blob,
              {
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
                opacity: b.opacity,
                transform: [{ translateY: i % 2 === 0 ? blobY : Animated.multiply(blobY, -1) }],
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.Text style={[styles.logo, { transform: [{ scale: pulse }] }]}>
            💥
          </Animated.Text>
          <Text style={styles.title}>{t.home.title}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>


        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNewGame} activeOpacity={0.85}>
            <Text style={styles.primaryBtnEmoji}>🎮</Text>
            <Text style={styles.primaryBtnText}>{t.home.newGame}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>📜  {t.home.history}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>⚙️  {t.home.settings}</Text>
          </TouchableOpacity>
        </View>

        {/* Language quick-toggle */}
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, settings.language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, settings.language === 'en' && styles.langBtnTextActive]}>
              🇺🇸 EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, settings.language === 'he' && styles.langBtnActive]}
            onPress={() => setLanguage('he')}
          >
            <Text style={[styles.langBtnText, settings.language === 'he' && styles.langBtnTextActive]}>
              🇮🇱 עב
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
              {t.settings.title}
            </Text>

            <SettingRow
              label={t.settings.sound}
              value={settings.soundEnabled}
              onChange={setSoundEnabled}
              isRTL={isRTL}
            />
            <SettingRow
              label={t.settings.tts}
              value={settings.ttsEnabled}
              onChange={setTtsEnabled}
              isRTL={isRTL}
            />

            <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>
              {t.settings.language}
            </Text>
            <View style={styles.langRowModal}>
              <TouchableOpacity
                style={[styles.langBtnModal, settings.language === 'en' && styles.langBtnModalActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnModalText, settings.language === 'en' && styles.langBtnModalTextActive]}>
                  🇺🇸 {t.settings.english}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtnModal, settings.language === 'he' && styles.langBtnModalActive]}
                onPress={() => setLanguage('he')}
              >
                <Text style={[styles.langBtnModalText, settings.language === 'he' && styles.langBtnModalTextActive]}>
                  🇮🇱 {t.settings.hebrew}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.closeBtnText}>{t.common.ok}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  isRTL,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.settingRow, isRTL && styles.settingRowRTL]}>
      <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#6C63FF' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0B1E',
  },
  blob: {
    position: 'absolute',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 36,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 88,
    marginBottom: 4,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(108,99,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    textAlign: 'center',
  },

  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnEmoji: {
    fontSize: 24,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 17,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langBtnActive: {
    backgroundColor: 'rgba(108,99,255,0.4)',
    borderColor: '#6C63FF',
  },
  langBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 15,
  },
  langBtnTextActive: {
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    gap: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  rtlText: {
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRowRTL: {
    flexDirection: 'row-reverse',
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  langRowModal: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtnModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  langBtnModalActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  langBtnModalText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#374151',
  },
  langBtnModalTextActive: {
    color: '#fff',
  },
  closeBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
});
