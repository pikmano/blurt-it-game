/**
 * PurchaseModal — bottom sheet shown when user taps the locked 🌿 Plants card.
 * Shows Plants Pack contents, price, Buy and Restore buttons.
 */

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePurchase } from '../context/PurchaseContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  language: 'en' | 'he';
}

// ─── Content ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { emoji: '🌸', en: 'Flowers',    he: 'פרחים' },
  { emoji: '🥦', en: 'Vegetables', he: 'ירקות' },
  { emoji: '🍎', en: 'Fruits',     he: 'פירות' },
  { emoji: '🌳', en: 'Trees',      he: 'עצים'  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseModal({ visible, onClose, language }: Props) {
  const {
    plantsUnlocked,
    plantsPrice,
    purchasing,
    restoring,
    error,
    purchasePlants,
    restorePurchases,
    clearError,
  } = usePurchase();

  const isRTL = language === 'he';
  const busy   = purchasing || restoring;

  // Auto-close when purchase completes
  useEffect(() => {
    if (plantsUnlocked && visible) onClose();
  }, [plantsUnlocked, visible, onClose]);

  const t = {
    title:     isRTL ? 'חבילת הצמחים 🌿'       : '🌿 Plants Pack',
    subtitle:  isRTL ? 'פתח קטגוריה חדשה!'      : 'Unlock a new category!',
    includes:  isRTL ? 'מה כלול:'               : "What's included:",
    buy:       isRTL ? 'רכישה'                  : 'Unlock',
    loading:   isRTL ? 'טוען...'                : 'Loading…',
    restore:   isRTL ? 'שחזור רכישה קודמת'      : 'Restore previous purchase',
    onePay:    isRTL ? '💳 תשלום חד-פעמי'        : '💳 One-time purchase',
    noSub:     isRTL ? 'ללא מנוי'               : 'No subscription',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dim backdrop — tap to dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Sheet — stop propagation so taps inside don't close */}
        <Pressable style={[styles.sheet, isRTL && styles.sheetRTL]} onPress={() => {}}>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={[styles.title, isRTL && styles.rtl]}>{t.title}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtl]}>{t.subtitle}</Text>

          {/* Feature list */}
          <Text style={[styles.includesLabel, isRTL && styles.rtl]}>{t.includes}</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureLabel}>
                  {isRTL ? f.he : f.en}
                </Text>
              </View>
            ))}
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t.onePay}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t.noSub}</Text>
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <TouchableOpacity onPress={clearError} style={styles.errorBox}>
              <Text style={styles.errorText}>{error}  ✕</Text>
            </TouchableOpacity>
          )}

          {/* Buy button */}
          <TouchableOpacity
            style={[styles.buyBtn, busy && styles.buyBtnBusy]}
            onPress={purchasePlants}
            disabled={busy}
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyBtnText}>
                {plantsPrice ? `${t.buy} — ${plantsPrice}` : t.loading}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={restorePurchases}
            disabled={busy}
            activeOpacity={0.7}
          >
            {restoring ? (
              <ActivityIndicator color="#6C63FF" size="small" />
            ) : (
              <Text style={styles.restoreText}>{t.restore}</Text>
            )}
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  sheetRTL: {
    alignItems: 'flex-end',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  rtl: {
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: -6,
  },
  includesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  featureEmoji: {
    fontSize: 26,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  buyBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyBtnBusy: {
    opacity: 0.7,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 36,
  },
  restoreText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
