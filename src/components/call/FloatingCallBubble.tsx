import React from 'react';
import { Maximize2, PhoneOff } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const FloatingCallBubble: React.FC = () => {
  const { callState, partnerProfile, callDuration, isMinimized, toggleMinimize, endCall } = useCall();

  if ((callState !== 'connected' && callState !== 'outgoing') || !isMinimized || !partnerProfile) {
    return null;
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        zIndex: 99990,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '30px',
        padding: '6px 12px 6px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
        color: '#fff',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={toggleMinimize}>
        <Avatar src={partnerProfile.avatar_url} name={partnerProfile.display_name} size="sm" />
        <span
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#10B981',
            border: '2px solid #0F172A',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={toggleMinimize}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.1 }}>
          {partnerProfile.display_name.split(' ')[0]}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 600 }}>
          {callState === 'connected' ? formatTimer(callDuration) : 'Calling...'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
        <button
          onClick={toggleMinimize}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Restore full screen"
        >
          <Maximize2 size={13} />
        </button>

        <button
          onClick={() => endCall('User ended call from floating bubble')}
          style={{
            background: '#EF4444',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="End call"
        >
          <PhoneOff size={13} />
        </button>
      </div>
    </div>
  );
};
