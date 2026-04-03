/**
 * PurchaseContext — manages IAP state for the whole app.
 * Wrap the root navigator with <PurchaseProvider>.
 *
 * PRODUCT ID:  plants_pack
 * Create this in Play Console → Monetize → In-app products before submitting.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLANTS_SKU = 'plants_pack';
const STORAGE_KEY       = 'alphaburst_plants_unlocked_v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseContextValue {
  /** true once the user has bought (or restored) the Plants Pack */
  plantsUnlocked: boolean;
  /** localised price string, e.g. "$1.99" – null while loading */
  plantsPrice: string | null;
  /** true while a purchase flow is in progress */
  purchasing: boolean;
  /** true while restore is in progress */
  restoring: boolean;
  /** last error message, auto-cleared after 4 s */
  error: string | null;
  /** trigger the Google Play purchase sheet */
  purchasePlants: () => Promise<void>;
  /** restore a previous purchase (user reinstalled app) */
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PurchaseContext = createContext<PurchaseContextValue>({
  plantsUnlocked: false,
  plantsPrice: null,
  purchasing: false,
  restoring: false,
  error: null,
  purchasePlants: async () => {},
  restorePurchases: async () => {},
  clearError: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [plantsUnlocked, setPlantsUnlocked] = useState(false);
  const [product, setProduct]               = useState<Product | null>(null);
  const [purchasing, setPurchasing]         = useState(false);
  const [restoring, setRestoring]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [storeReady, setStoreReady]         = useState(false);

  const purchaseListenerRef = useRef<ReturnType<typeof purchaseUpdatedListener> | null>(null);
  const errorListenerRef    = useRef<ReturnType<typeof purchaseErrorListener> | null>(null);
  const errorTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef          = useRef(true);

  // ── show error, auto-clear after 4 s ────────────────────────────────────
  const showError = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setError(null);
    }, 4000);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ── persist & apply unlock ───────────────────────────────────────────────
  const unlock = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    if (mountedRef.current) {
      setPlantsUnlocked(true);
      setPurchasing(false);
    }
  }, []);

  // ── init on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // 1. Restore persisted unlock immediately (before store is ready)
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'true' && mountedRef.current) setPlantsUnlocked(true);
    });

    // 2. Connect to Play Store / App Store
    async function init() {
      try {
        await initConnection();
        if (!mountedRef.current) return;
        setStoreReady(true);

        // Fetch product info (price, name, etc.)
        const products = await fetchProducts({ skus: [PLANTS_SKU] });
        if (mountedRef.current && products && products.length > 0) {
          setProduct(products[0] as Product);
        }
      } catch (e) {
        // Expected in dev builds / emulators without Play Services
        console.warn('[IAP] initConnection failed (OK in dev):', (e as Error).message);
      }
    }
    init();

    // 3. Listen for successful purchase
    purchaseListenerRef.current = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (purchase.productId !== PLANTS_SKU) return;
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await unlock();
      } catch (e) {
        console.warn('[IAP] finishTransaction error:', e);
      }
    });

    // 4. Listen for purchase errors
    errorListenerRef.current = purchaseErrorListener((err: PurchaseError) => {
      if (err.code !== ErrorCode.UserCancelled) {
        showError(err.message ?? 'Purchase failed. Please try again.');
      }
      if (mountedRef.current) setPurchasing(false);
    });

    return () => {
      mountedRef.current = false;
      purchaseListenerRef.current?.remove();
      errorListenerRef.current?.remove();
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      endConnection().catch(() => {});
    };
  }, [unlock, showError]);

  // ── trigger purchase ─────────────────────────────────────────────────────
  const purchasePlants = useCallback(async () => {
    if (!storeReady) {
      showError('Store not available. Check your connection and try again.');
      return;
    }
    setPurchasing(true);
    clearError();
    try {
      await requestPurchase({
        request: { google: { skus: [PLANTS_SKU] } },
        type: 'in-app',
      });
      // Result arrives via purchaseUpdatedListener
    } catch (e: any) {
      if (e?.code !== ErrorCode.UserCancelled) {
        showError(e?.message ?? 'Purchase failed. Please try again.');
      }
      if (mountedRef.current) setPurchasing(false);
    }
  }, [storeReady, showError, clearError]);

  // ── restore purchases ────────────────────────────────────────────────────
  const restorePurchases = useCallback(async () => {
    if (!storeReady) {
      showError('Store not available. Check your connection and try again.');
      return;
    }
    setRestoring(true);
    clearError();
    try {
      const purchases = await getAvailablePurchases();
      const found = purchases?.some(p => p.productId === PLANTS_SKU);
      if (found) {
        await unlock();
      } else {
        showError('No previous purchase found for this account.');
      }
    } catch (e: any) {
      showError(e?.message ?? 'Restore failed. Please try again.');
    } finally {
      if (mountedRef.current) setRestoring(false);
    }
  }, [storeReady, unlock, showError, clearError]);

  // ── derive display price ─────────────────────────────────────────────────
  // Android products use displayPrice, iOS uses localizedPriceIOS
  const plantsPrice = product
    ? (product as any).displayPrice ?? (product as any).localizedPriceIOS ?? null
    : null;

  return (
    <PurchaseContext.Provider
      value={{
        plantsUnlocked,
        plantsPrice,
        purchasing,
        restoring,
        error,
        purchasePlants,
        restorePurchases,
        clearError,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePurchase() {
  return useContext(PurchaseContext);
}
