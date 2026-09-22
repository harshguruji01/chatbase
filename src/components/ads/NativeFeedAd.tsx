import React, { useEffect, useRef } from 'react';
import { Star, ShieldCheck, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { AD_CONFIG } from '../../config/ads';

interface NativeFeedAdProps {
  index?: number;
}

const SPONSORED_OFFERS = [
  {
    title: 'WebGuruJi App & Software Store',
    tagline: 'Discover top premium Android apps, tools & mods with 1-click install.',
    cta: 'Explore & Download',
    rating: '4.9 ★',
    downloads: '100K+ installs',
    badge: 'Trending App',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    icon: Sparkles,
  },
  {
    title: 'ChatBase Android APK - Instant Connect',
    tagline: 'Unlock HD Voice Notes, Live GPS Radar, and 120Hz Fast Messaging!',
    cta: 'Install Official APK',
    rating: '5.0 ★',
    downloads: 'Free Download',
    badge: 'Must Have',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    icon: Zap,
  },
  {
    title: 'Ultra High-Speed Cloud VPN & Privacy',
    tagline: 'Zero-log encryption, turbo streaming speeds & safe public Wi-Fi browsing.',
    cta: 'Claim Free Access',
    rating: '4.8 ★',
    downloads: 'Verified Safe',
    badge: 'Security Pick',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    icon: ShieldCheck,
  },
];

export const NativeFeedAd: React.FC<NativeFeedAdProps> = ({ index = 0 }) => {
  const adRef = useRef<HTMLModElement>(null);
  const offer = SPONSORED_OFFERS[index % SPONSORED_OFFERS.length];
  const IconComp = offer.icon;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ads fallback is handled gracefully
    }
  }, []);

  const handleClickAd = () => {
    window.open(AD_CONFIG.defaultTargetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card fade-in-up"
      onClick={handleClickAd}
      style={{
        padding: '18px 20px',
        margin: '12px 0',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid rgba(99, 102, 241, 0.35)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.12))',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Hidden/Active Google AdsbyGoogle Slot for Native Advanced (Slot: 8103452302) */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'none' }}
        data-ad-client={AD_CONFIG.webClientId}
        data-ad-slot={AD_CONFIG.slots.nativeAdvanced}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />

      {/* Top Header: Ad Badge & Sponsor Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            Ad • Sponsored
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {offer.badge}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#F59E0B', fontWeight: 700 }}>
          <Star size={13} fill="#F59E0B" />
          <span>{offer.rating}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• {offer.downloads}</span>
        </div>
      </div>

      {/* Main Content Info */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: offer.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <IconComp size={24} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {offer.title}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {offer.tagline}
          </p>
        </div>
      </div>

      {/* Interactive CTA Banner */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.88rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} />
          {offer.cta}
        </span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};
