import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  EyeOff,
  Palette,
  Volume2,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { Modal } from './Modal';

export const PremiumUpgradeModal: React.FC = () => {
  const {
    isPremium,
    premiumPlan,
    premiumUntil,
    isUpgradeModalOpen,
    upgradeHighlight,
    closeUpgradeModal,
    upgradeToPlan,
    redeemPromoCode,
    cancelSubscription,
  } = usePremium();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCodeInput.trim()) return;

    const res = redeemPromoCode(promoCodeInput);
    if (res.success) {
      setPromoCodeInput('');
    } else {
      setPromoError(res.message);
    }
  };

  const handleUpgrade = () => {
    upgradeToPlan(selectedPlan);
  };

  const benefits = [
    {
      icon: ShieldCheck,
      color: '#10b981',
      title: '100% Ad-Free Experience',
      desc: 'No bottom banners, no interstitial popups, and no sponsored cards on Web & Android APK.',
      highlightKey: 'ads',
    },
    {
      icon: Zap,
      color: '#8b5cf6',
      title: 'Unlimited GuruJi AI Copilot',
      desc: 'Bypass the 5/day message cap with high-speed priority AI smart drafts and replies.',
      highlightKey: 'ai',
    },
    {
      icon: Crown,
      color: '#f59e0b',
      title: 'Prestige Golden VIP Badge',
      desc: 'Shining gold crown displayed beside your profile in chats, radar, stories, and feed.',
      highlightKey: 'badge',
    },
    {
      icon: EyeOff,
      color: '#3b82f6',
      title: 'Ghost Incognito Radar',
      desc: 'Scan nearby users secretly without broadcasting your own presence or location.',
      highlightKey: 'radar',
    },
    {
      icon: Palette,
      color: '#ec4899',
      title: 'Exclusive VIP Chat Themes & Wallpapers',
      desc: 'Unlock Cosmic Galaxy, Emerald Aurora, Luxury Velvet Gold, and Cyberpunk Neon.',
      highlightKey: 'wallpaper',
    },
    {
      icon: Volume2,
      color: '#06b6d4',
      title: 'Extended 150km Radar & HD Voice',
      desc: 'Triple your radar search radius to 150km with studio-quality audio bitrate.',
      highlightKey: 'general',
    },
  ];

  const plans = [
    {
      id: 'monthly' as const,
      name: 'Monthly VIP',
      price: '₹99',
      period: '/ month',
      subtext: 'Billed monthly. Cancel anytime.',
      badge: null,
    },
    {
      id: 'annual' as const,
      name: 'Annual VIP',
      price: '₹699',
      period: '/ year',
      subtext: 'Just ₹58/month. Save 42%!',
      badge: '🔥 MOST POPULAR',
    },
    {
      id: 'lifetime' as const,
      name: 'Lifetime Ultra',
      price: '₹1,499',
      period: 'once',
      subtext: 'Pay once, enjoy VIP access forever.',
      badge: '💎 BEST VALUE',
    },
  ];

  return (
    <Modal isOpen={isUpgradeModalOpen} onClose={closeUpgradeModal} title="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Hero */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '24px 20px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Luminous Glow Behind Crown */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(20px)',
            }}
          />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
              marginBottom: '12px',
            }}
          >
            <Crown size={36} color="#ffffff" />
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 30%, #fef08a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {isPremium ? 'ChatBase VIP Active 👑' : 'Upgrade to ChatBase VIP'}
          </h2>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isPremium
              ? `You are enjoying all exclusive VIP perks under the ${premiumPlan.toUpperCase()} plan.`
              : 'Elevate your messaging with ad-free browsing, unlimited AI, ghost radar, and custom themes.'}
          </p>

          {isPremium && premiumUntil && (
            <div
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                color: '#fbbf24',
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} />
              Active until: {new Date(premiumUntil).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Highlight Banner if triggered by a specific feature */}
        {upgradeHighlight && !isPremium && (
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#c4b5fd',
            }}
          >
            <Sparkles size={16} color="#a78bfa" />
            <span>
              <strong>VIP Exclusive:</strong> You unlocked a preview for this feature. Upgrade to activate permanently!
            </span>
          </div>
        )}

        {/* Benefits Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            VIP Member Privileges
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
            }}
          >
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              const isHighlighted = upgradeHighlight === b.highlightKey;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isHighlighted ? 'rgba(245, 158, 11, 0.1)' : 'var(--card-bg)',
                    border: isHighlighted
                      ? '1px solid rgba(245, 158, 11, 0.5)'
                      : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${b.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={b.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {b.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans Selector (if not premium) */}
        {!isPremium ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Membership Tier
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
              }}
            >
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '14px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))'
                        : 'var(--card-bg)',
                      border: isSelected
                        ? '2px solid #f59e0b'
                        : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                    }}
                  >
                    {p.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-9px',
                          right: '8px',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff',
                          fontSize: '8px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {p.badge}
                      </span>
                    )}

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {p.price}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {p.period}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {p.subtext}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instant Activation CTA Button */}
            <button
              onClick={handleUpgrade}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.2s ease',
                marginTop: '4px',
              }}
            >
              <Crown size={18} />
              <span>Activate {plans.find((p) => p.id === selectedPlan)?.name} Now</span>
              <ArrowRight size={16} />
            </button>

            {/* Promo Code Form */}
            <form
              onSubmit={handleApplyPromo}
              style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--input-bg)',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginTop: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'var(--text-secondary)' }}>
                <Gift size={16} />
              </div>
              <input
                type="text"
                placeholder="Have a VIP Promo Code? (e.g. CHATBASEVIP)"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </form>

            {promoError && (
              <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '-4px' }}>
                {promoError}
              </div>
            )}
          </div>
        ) : (
          /* Already Premium: Management Controls */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Subscription Status
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                  ✓ Active & Valid
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {premiumPlan.toUpperCase()}
              </div>
            </div>

            {showCancelConfirm ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#f87171' }}>
                  Are you sure you want to cancel your VIP membership? You will lose ad-free browsing and unlimited AI.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      cancelSubscription();
                      setShowCancelConfirm(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Keep VIP
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Manage or Cancel Subscription
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
