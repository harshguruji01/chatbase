import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const IncomingCallModal: React.FC = () => {
  const { callState, callType, partnerProfile, acceptCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !partnerProfile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, rgba(8, 11, 18, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 24px 70px',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top Security & Brand Badge */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.5px',
          }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span>ChatBase End-to-End Encrypted</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          {callType === 'video' ? (
            <Video size={16} color="#38BDF8" />
          ) : (
            <Phone size={16} color="#38BDF8" />
          )}
          <span
            style={{
              fontSize: '0.85rem',
              color: '#38BDF8',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Incoming {callType === 'video' ? 'Video Call' : 'Voice Call'}...
          </span>
        </div>
      </div>

      {/* Center Caller Profile & Pulsing Glow */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '18px',
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Pulsing ring 1 */}
          <div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          {/* Pulsing ring 2 */}
          <div
            style={{
              position: 'absolute',
              inset: '-36px',
              borderRadius: '50%',
              border: '1.5px solid rgba(16, 185, 129, 0.25)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              animationDelay: '0.6s',
            }}
          />
          <Avatar
            src={partnerProfile.avatar_url}
            name={partnerProfile.display_name}
            size="xl"
            style={{
              width: '110px',
              height: '110px',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.4)',
              border: '3px solid rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>

        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
            {partnerProfile.display_name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            @{partnerProfile.username} {partnerProfile.user_code ? `• ${partnerProfile.user_code}` : ''}
          </p>
        </div>
      </div>

      {/* Bottom Action Buttons: Decline (Red) & Accept (Green) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '50px',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        {/* Decline Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => rejectCall('declined')}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#EF4444',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.92)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            aria-label="Decline Call"
          >
            <PhoneOff size={28} />
          </button>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>Decline</span>
        </div>

        {/* Accept Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={acceptCall}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#10B981',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)',
              animation: 'pulse 1.5s infinite',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.92)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            aria-label="Accept Call"
          >
            {callType === 'video' ? <Video size={28} /> : <Phone size={28} />}
          </button>
          <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Accept</span>
        </div>
      </div>
    </div>
  );
};
