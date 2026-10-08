import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const ActiveCallModal: React.FC = () => {
  const {
    callState,
    callType,
    partnerProfile,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    isMinimized,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleMinimize,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isMinimized]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, isMinimized]);

  if ((callState !== 'connected' && callState !== 'outgoing') || isMinimized || !partnerProfile) {
    return null;
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasRemoteVideo =
    callType === 'video' &&
    remoteStream &&
    remoteStream.getVideoTracks().length > 0 &&
    remoteStream.getVideoTracks().some((t) => t.enabled);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: '#0B141A',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Background / Remote Video */}
      {callType === 'video' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: '#0B141A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasRemoteVideo ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ position: 'relative' }}>
                {callState === 'connected' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-15px',
                      borderRadius: '50%',
                      border: '2px solid rgba(56, 189, 248, 0.3)',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                )}
                <Avatar
                  src={partnerProfile.avatar_url}
                  name={partnerProfile.display_name}
                  size="xl"
                  style={{ width: '120px', height: '120px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
                />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                {callState === 'outgoing' ? 'Ringing...' : 'Camera paused'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audio Call Background */}
      {callType === 'audio' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1E293B 0%, #0B141A 100%)',
            gap: '24px',
          }}
        >
          <div style={{ position: 'relative' }}>
            {callState === 'connected' && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '50%',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  animation: 'pulse 1.8s infinite',
                }}
              />
            )}
            <Avatar
              src={partnerProfile.avatar_url}
              name={partnerProfile.display_name}
              size="xl"
              style={{ width: '130px', height: '130px', boxShadow: '0 0 50px rgba(16, 185, 129, 0.25)' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 6px', fontWeight: 700 }}>
              {partnerProfile.display_name}
            </h3>
            <span style={{ fontSize: '0.95rem', color: '#10B981', fontWeight: 600 }}>
              {callState === 'connected' ? formatTimer(callDuration) : 'Calling...'}
            </span>
          </div>
        </div>
      )}

      {/* Top Header Controls & Info */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 20px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      >
        <button
          onClick={toggleMinimize}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          title="Minimize call to chat"
        >
          <Minimize2 size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            <ShieldCheck size={13} color="#10B981" />
            <span>End-to-End Encrypted</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '2px' }}>
            {partnerProfile.display_name}
          </span>
          <span style={{ fontSize: '0.82rem', color: callState === 'connected' ? '#38BDF8' : '#FBBF24' }}>
            {callState === 'connected' ? formatTimer(callDuration) : 'Calling...'}
          </span>
        </div>

        {/* Placeholder spacer */}
        <div style={{ width: '40px' }} />
      </div>

      {/* PiP Local Video Preview (for Video Calls) */}
      {callType === 'video' && (
        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            right: '20px',
            zIndex: 20,
            width: '110px',
            height: '160px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.25)',
            background: '#1F2937',
          }}
        >
          {!isVideoOff && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror selfie
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111827',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <VideoOff size={24} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Control Bar (WhatsApp Pill Style) */}
      <div
        style={{
          position: 'relative',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          padding: '24px 20px 40px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            padding: '10px 22px',
            borderRadius: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          }}
        >
          {/* Mute Mic Toggle */}
          <button
            onClick={toggleMute}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: isMuted ? '1.5px solid #EF4444' : 'none',
              color: isMuted ? '#EF4444' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Video Toggle (if video call) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isVideoOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: isVideoOff ? '1.5px solid #EF4444' : 'none',
                color: isVideoOff ? '#EF4444' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}

          {/* Switch Camera (if video call) */}
          {callType === 'video' && (
            <button
              onClick={switchCamera}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Switch Front/Back Camera"
            >
              <SwitchCamera size={22} />
            </button>
          )}

          {/* Hang Up (Red) */}
          <button
            onClick={() => endCall('User hung up')}
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#EF4444',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.92)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
