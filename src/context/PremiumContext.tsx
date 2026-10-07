import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import { soundEffects } from '../lib/soundEffects';

export type PremiumPlan = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface ChatWallpaper {
  id: string;
  name: string;
  previewColor: string;
  cssBackground: string;
  isVipOnly: boolean;
}

export const CHAT_WALLPAPERS: ChatWallpaper[] = [
  {
    id: 'default',
    name: 'Classic Dark',
    previewColor: '#0b0f19',
    cssBackground: 'transparent',
    isVipOnly: false,
  },
  {
    id: 'galaxy',
    name: 'Cosmic Galaxy',
    previewColor: '#160b2b',
    cssBackground: 'radial-gradient(ellipse at top, #1e1145 0%, #0d081f 60%, #06030c 100%)',
    isVipOnly: true,
  },
  {
    id: 'aurora',
    name: 'Emerald Aurora',
    previewColor: '#06231d',
    cssBackground: 'radial-gradient(ellipse at top left, #0d382f 0%, #081d19 50%, #040c0b 100%)',
    isVipOnly: true,
  },
  {
    id: 'gold',
    name: 'Luxury Velvet Gold',
    previewColor: '#251b08',
    cssBackground: 'radial-gradient(ellipse at top, #36280e 0%, #1c1407 60%, #0b0802 100%)',
    isVipOnly: true,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    previewColor: '#1a0928',
    cssBackground: 'linear-gradient(135deg, #1f082e 0%, #09091f 50%, #031525 100%)',
    isVipOnly: true,
  },
  {
    id: 'sunset',
    name: 'Sunset Nebula',
    previewColor: '#2b101c',
    cssBackground: 'radial-gradient(circle at bottom, #3b1424 0%, #1a0b1c 50%, #0c050f 100%)',
    isVipOnly: true,
  },
];

interface PremiumContextType {
  isPremium: boolean;
  premiumPlan: PremiumPlan;
  premiumUntil: string | null;
  aiQueriesRemaining: number;
  maxAiQueries: number;
  canUseAI: boolean;
  recordAIQuery: () => boolean;
  incognitoRadar: boolean;
  setIncognitoRadar: (val: boolean) => void;
  radarMaxDistance: number;
  chatWallpaper: string;
  setChatWallpaper: (wallpaperId: string) => void;
  isUpgradeModalOpen: boolean;
  upgradeHighlight: string | null;
  openUpgradeModal: (highlight?: string) => void;
  closeUpgradeModal: () => void;
  upgradeToPlan: (plan: 'monthly' | 'annual' | 'lifetime') => void;
  redeemPromoCode: (code: string) => { success: boolean; message: string };
  cancelSubscription: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const MAX_FREE_DAILY_AI_QUERIES = 5;

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Premium status state (hydrated from localStorage and synced with profile)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      const local = localStorage.getItem('chatbase_is_premium');
      return local === 'true';
    } catch {
      return false;
    }
  });

  const [premiumPlan, setPremiumPlan] = useState<PremiumPlan>(() => {
    try {
      return (localStorage.getItem('chatbase_premium_plan') as PremiumPlan) || 'free';
    } catch {
      return 'free';
    }
  });

  const [premiumUntil, setPremiumUntil] = useState<string | null>(() => {
    try {
      return localStorage.getItem('chatbase_premium_until');
    } catch {
      return null;
    }
  });

  // Incognito Radar state
  const [incognitoRadar, setIncognitoRadarState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chatbase_incognito_radar') === 'true';
    } catch {
      return false;
    }
  });

  // Chat Wallpaper state
  const [chatWallpaper, setChatWallpaperState] = useState<string>(() => {
    try {
      return localStorage.getItem('chatbase_chat_wallpaper') || 'default';
    } catch {
      return 'default';
    }
  });

  // Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeHighlight, setUpgradeHighlight] = useState<string | null>(null);

  // Daily AI Usage tracking
  const getTodayKey = () => {
    const d = new Date();
    return `chatbase_ai_usage_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
  };

  const [aiUsageToday, setAiUsageToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(getTodayKey());
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Sync with profile if available
  useEffect(() => {
    if (profile?.is_premium !== undefined) {
      if (profile.is_premium) {
        setIsPremium(true);
        setPremiumPlan(profile.premium_plan || 'monthly');
        setPremiumUntil(profile.premium_until || null);
        localStorage.setItem('chatbase_is_premium', 'true');
        if (profile.premium_plan) {
          localStorage.setItem('chatbase_premium_plan', profile.premium_plan);
        }
        if (profile.premium_until) {
          localStorage.setItem('chatbase_premium_until', profile.premium_until);
        }
      }
    }
  }, [profile]);

  const openUpgradeModal = useCallback((highlight?: string) => {
    setUpgradeHighlight(highlight || null);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setUpgradeHighlight(null);
  }, []);

  // Set incognito radar (only VIP can enable)
  const setIncognitoRadar = useCallback((val: boolean) => {
    if (val && !isPremium) {
      openUpgradeModal('radar');
      showToast('Ghost Incognito Radar requires ChatBase VIP 👑', 'info');
      return;
    }
    setIncognitoRadarState(val);
    localStorage.setItem('chatbase_incognito_radar', String(val));
    showToast(val ? '👻 Ghost Incognito Radar Enabled' : 'Radar set to standard visibility', 'info');
  }, [isPremium, openUpgradeModal, showToast]);

  // Set chat wallpaper
  const setChatWallpaper = useCallback((wallpaperId: string) => {
    const wp = CHAT_WALLPAPERS.find((w) => w.id === wallpaperId);
    if (wp?.isVipOnly && !isPremium) {
      openUpgradeModal('wallpaper');
      showToast('Exclusive Chat Themes require ChatBase VIP 👑', 'info');
      return;
    }
    setChatWallpaperState(wallpaperId);
    localStorage.setItem('chatbase_chat_wallpaper', wallpaperId);
    showToast(`Wallpaper changed to ${wp?.name || wallpaperId}`, 'success');
  }, [isPremium, openUpgradeModal, showToast]);

  // AI Usage calculations
  const canUseAI = isPremium || aiUsageToday < MAX_FREE_DAILY_AI_QUERIES;
  const aiQueriesRemaining = isPremium
    ? Infinity
    : Math.max(0, MAX_FREE_DAILY_AI_QUERIES - aiUsageToday);

  const recordAIQuery = useCallback((): boolean => {
    if (isPremium) return true;

    if (aiUsageToday >= MAX_FREE_DAILY_AI_QUERIES) {
      openUpgradeModal('ai');
      showToast('Free daily AI limit reached (5/5). Upgrade to VIP for unlimited queries!', 'info');
      return false;
    }

    const next = aiUsageToday + 1;
    setAiUsageToday(next);
    localStorage.setItem(getTodayKey(), String(next));
    return true;
  }, [isPremium, aiUsageToday, openUpgradeModal, showToast]);

  // Upgrade handler
  const upgradeToPlan = useCallback((plan: 'monthly' | 'annual' | 'lifetime') => {
    setIsPremium(true);
    setPremiumPlan(plan);

    const expiry = new Date();
    if (plan === 'monthly') {
      expiry.setDate(expiry.getDate() + 30);
    } else if (plan === 'annual') {
      expiry.setDate(expiry.getDate() + 365);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 100);
    }
    const expiryStr = expiry.toISOString();
    setPremiumUntil(expiryStr);

    localStorage.setItem('chatbase_is_premium', 'true');
    localStorage.setItem('chatbase_premium_plan', plan);
    localStorage.setItem('chatbase_premium_until', expiryStr);

    // Sync to Supabase profile
    updateProfile({
      is_premium: true,
      premium_plan: plan,
      premium_until: expiryStr,
    }).catch(() => {
      // Graceful fallback if column doesn't exist yet
    });

    closeUpgradeModal();
    soundEffects.play('notify');

    // Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'],
      });
    } catch {}

    showToast(`👑 Welcome to ChatBase VIP! You are now subscribed to ${plan.toUpperCase()}!`, 'success');
  }, [closeUpgradeModal, showToast, updateProfile]);

  // Promo code redemption
  const redeemPromoCode = useCallback((code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    const VALID_CODES = ['CHATBASEVIP', 'GOLD2026', 'PREMIUM', 'HARSHVIP', 'FREEVIP', 'VIP100'];

    if (VALID_CODES.includes(clean)) {
      upgradeToPlan('lifetime');
      return { success: true, message: 'VIP Promo Code applied! Lifetime VIP Activated 👑' };
    }

    return { success: false, message: 'Invalid or expired VIP promo code. Try CHATBASEVIP or GOLD2026.' };
  }, [upgradeToPlan]);

  // Cancel subscription
  const cancelSubscription = useCallback(() => {
    setIsPremium(false);
    setPremiumPlan('free');
    setPremiumUntil(null);
    setIncognitoRadarState(false);
    setChatWallpaperState('default');

    localStorage.removeItem('chatbase_is_premium');
    localStorage.removeItem('chatbase_premium_plan');
    localStorage.removeItem('chatbase_premium_until');
    localStorage.removeItem('chatbase_incognito_radar');
    localStorage.removeItem('chatbase_chat_wallpaper');

    updateProfile({
      is_premium: false,
      premium_plan: null,
      premium_until: null,
    }).catch(() => {});

    showToast('VIP Subscription cancelled. You are now on the Free tier.', 'info');
  }, [showToast, updateProfile]);

  const radarMaxDistance = isPremium ? 150 : 50;

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        premiumPlan,
        premiumUntil,
        aiQueriesRemaining,
        maxAiQueries: MAX_FREE_DAILY_AI_QUERIES,
        canUseAI,
        recordAIQuery,
        incognitoRadar,
        setIncognitoRadar,
        radarMaxDistance,
        chatWallpaper,
        setChatWallpaper,
        isUpgradeModalOpen,
        upgradeHighlight,
        openUpgradeModal,
        closeUpgradeModal,
        upgradeToPlan,
        redeemPromoCode,
        cancelSubscription,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
