import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, ArrowRight } from 'lucide-react';
import { AD_CONFIG } from '../../config/ads';

export const BottomStickyAd: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // ignore
    }
  }, []);

  if (isDismissed) return null;

  const handleAdClick = () => {
    window.open(AD_CONFIG.defaultTargetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        zIndex: 40,
        position: 'relative',
      }}
    >
      {/* Hidden AdSense Banner Slot 9840129247 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'none' }}
        data-ad-client={AD_CONFIG.webClientId}
        data-ad-slot={AD_CONFIG.slots.banner}
        data-ad-format="horizontal"
      />

      <div
        onClick={handleAdClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
          minWidth: 0,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #EC4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Sparkles size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              SPONSORED
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ChatBase Android Official App
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ⚡ HD Voice Notes, Live GPS Radar & Push Alerts
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleAdClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Download size={13} />
          <span>Install Now</span>
          <ArrowRight size={13} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss Ad"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
