import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { useGame } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { strings, settings, isRTL, setLanguage, setSoundEnabled, setTtsEnabled } =
    useAppSettings();
  const { dispatch } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const t = strings;

  const handleNewGame = () => {
    dispatch({ type: 'RESET' });
    navigation.navigate('Setup');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Logo / Title */}
        <View style={styles.hero}>
          <Text style={styles.logo}>💥</Text>
          <Text style={styles.title}>{t.home.title}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNewGame} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>🎮 {t.home.newGame}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>📜 {t.home.history}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>⚙️ {t.home.settings}</Text>
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

            {/* Language selection */}
            <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>
              {t.settings.language}
            </Text>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langBtn, settings.language === 'en' && styles.langBtnActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnText, settings.language === 'en' && styles.langBtnTextActive]}>
                  🇺🇸 {t.settings.english}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, settings.language === 'he' && styles.langBtnActive]}
                onPress={() => setLanguage('he')}
              >
                <Text style={[styles.langBtnText, settings.language === 'he' && styles.langBtnTextActive]}>
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
    backgroundColor: '#6C63FF',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 80,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#6C63FF',
    fontSize: 22,
    fontWeight: '900',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  langBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  langBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 15,
  },
  langBtnTextActive: {
    color: '#6C63FF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
