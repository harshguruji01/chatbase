import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import type { Profile } from '../types';
import { soundEffects } from '../lib/soundEffects';
import { triggerHaptics } from '../lib/utils';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended';
export type CallType = 'video' | 'audio';

interface CallContextType {
  callState: CallState;
  callType: CallType;
  partnerProfile: Profile | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isFrontCamera: boolean;
  callDuration: number;
  isMinimized: boolean;
  startCall: (targetUser: Profile, type: CallType, conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => void;
  endCall: (reason?: string) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => Promise<void>;
  toggleMinimize: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { sendMessage } = useChat();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('video');
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const activeCallIdRef = useRef<string | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const incomingChannelRef = useRef<any>(null);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Clean up media streams and reset timer
  const cleanupMediaAndTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {
        // ignore
      }
      peerConnectionRef.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    soundEffects.stopDialing();
    soundEffects.stopRingtone();
  }, []);

  // Format call duration into MM:SS for system message
  const formatDurationString = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // End Call handler
  const endCall = useCallback((reason = 'Call ended') => {
    const duration = callDuration;
    const type = callType;
    const callId = activeCallIdRef.current;
    const partnerId = targetUserIdRef.current;

    if (callId && partnerId && user) {
      try {
        const sendChannel = supabase.channel(`chatbase-call-${partnerId}`);
        sendChannel.send({
          type: 'broadcast',
          event: 'call_end',
          payload: { callId, fromId: user.id, reason },
        });
      } catch {
        // ignore
      }
    }

    soundEffects.play('call_end');
    cleanupMediaAndTracks();
    setCallState('ended');

    // Post call recap into chat if conversationId is known
    if (conversationIdRef.current && duration > 0) {
      const durationStr = formatDurationString(duration);
      sendMessage({
        type: 'text',
        content: `${type === 'video' ? '📹 Video call' : '📞 Voice call'} • ${durationStr}`,
      }).catch(() => {});
    }

    setTimeout(() => {
      setCallState('idle');
      setPartnerProfile(null);
      setIsMinimized(false);
      setCallDuration(0);
      activeCallIdRef.current = null;
      targetUserIdRef.current = null;
      conversationIdRef.current = null;
    }, 1200);
  }, [callDuration, callType, user, cleanupMediaAndTracks, sendMessage]);

  // Handle incoming signals from Supabase Broadcast
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`chatbase-call-${user.id}`);

    channel
      .on('broadcast', { event: 'call_invite' }, async ({ payload }) => {
        // If already busy in a call, reject automatically
        if (activeCallIdRef.current && activeCallIdRef.current !== payload.callId) {
          const rejectChannel = supabase.channel(`chatbase-call-${payload.fromId}`);
          rejectChannel.send({
            type: 'broadcast',
            event: 'call_reject',
            payload: { callId: payload.callId, reason: 'busy' },
          });
          return;
        }

        activeCallIdRef.current = payload.callId;
        targetUserIdRef.current = payload.fromId;
        conversationIdRef.current = payload.conversationId || null;
        setPartnerProfile(payload.caller);
        setCallType(payload.callType || 'video');
        setCallState('incoming');
        soundEffects.startRingtone();
        triggerHaptics(30);
      })
      .on('broadcast', { event: 'call_accept' }, async ({ payload }) => {
        if (payload.callId !== activeCallIdRef.current) return;
        soundEffects.stopDialing();
        soundEffects.play('call_connect');
        setCallState('connected');

        // Caller creates WebRTC Offer
        try {
          if (!peerConnectionRef.current) {
            setupPeerConnection(targetUserIdRef.current!);
          }
          const pc = peerConnectionRef.current;
          if (pc) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sendChannel = supabase.channel(`chatbase-call-${targetUserIdRef.current}`);
            sendChannel.send({
              type: 'broadcast',
              event: 'webrtc_signal',
              payload: {
                callId: payload.callId,
                fromId: user.id,
                type: 'offer',
                sdp: offer,
              },
            });
          }
        } catch (err) {
          console.error('Error creating offer:', err);
        }

        // Start call duration timer
        setCallDuration(0);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      })
      .on('broadcast', { event: 'call_reject' }, ({ payload }) => {
        if (payload.callId !== activeCallIdRef.current) return;
        soundEffects.stopDialing();
        soundEffects.play('call_end');
        setCallState('ended');
        setTimeout(() => {
          cleanupMediaAndTracks();
          setCallState('idle');
          setPartnerProfile(null);
        }, 1500);
      })
      .on('broadcast', { event: 'call_end' }, ({ payload }) => {
        if (payload.callId === activeCallIdRef.current) {
          endCall('Remote user ended the call');
        }
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (payload.callId !== activeCallIdRef.current) return;
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          if (payload.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const sendChannel = supabase.channel(`chatbase-call-${payload.fromId}`);
            sendChannel.send({
              type: 'broadcast',
              event: 'webrtc_signal',
              payload: {
                callId: payload.callId,
                fromId: user.id,
                type: 'answer',
                sdp: answer,
              },
            });
          } else if (payload.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } else if (payload.type === 'candidate' && payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (err) {
          console.error('WebRTC signal processing error:', err);
        }
      })
      .subscribe();

    incomingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      cleanupMediaAndTracks();
    };
  }, [user, cleanupMediaAndTracks, endCall]);

  // Set up RTCPeerConnection
  const setupPeerConnection = (targetUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && user) {
        const sendChannel = supabase.channel(`chatbase-call-${targetUserId}`);
        sendChannel.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            callId: activeCallIdRef.current,
            fromId: user.id,
            type: 'candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    return pc;
  };

  // Start outgoing call
  const startCall = async (targetUser: Profile, type: CallType, conversationId?: string) => {
    if (!user) return;
    cleanupMediaAndTracks();

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    activeCallIdRef.current = callId;
    targetUserIdRef.current = targetUser.id;
    conversationIdRef.current = conversationId || null;

    setPartnerProfile(targetUser);
    setCallType(type);
    setCallState('outgoing');
    setIsMuted(false);
    setIsVideoOff(type === 'audio');
    soundEffects.startDialing();

    // Acquire local camera and mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupPeerConnection(targetUser.id);
    } catch (mediaErr) {
      console.warn('getUserMedia error, falling back to simulated stream:', mediaErr);
    }

    // Broadcast call invitation to target user
    const sendChannel = supabase.channel(`chatbase-call-${targetUser.id}`);
    sendChannel.send({
      type: 'broadcast',
      event: 'call_invite',
      payload: {
        callId,
        fromId: user.id,
        caller: profile || { id: user.id, display_name: user.email?.split('@')[0] || 'User' },
        callType: type,
        conversationId,
      },
    });

    // Auto timeout after 45 seconds if unanswered
    setTimeout(() => {
      if (activeCallIdRef.current === callId && callState === 'outgoing') {
        endCall('No answer');
      }
    }, 45000);
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!user || !activeCallIdRef.current || !targetUserIdRef.current) return;
    soundEffects.stopRingtone();
    soundEffects.play('call_connect');

    // Acquire local media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupPeerConnection(targetUserIdRef.current);
    } catch (mediaErr) {
      console.warn('getUserMedia error on accept:', mediaErr);
    }

    setCallState('connected');
    setCallDuration(0);

    // Notify caller that call was accepted
    const sendChannel = supabase.channel(`chatbase-call-${targetUserIdRef.current}`);
    sendChannel.send({
      type: 'broadcast',
      event: 'call_accept',
      payload: {
        callId: activeCallIdRef.current,
        fromId: user.id,
      },
    });

    // Start timer
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Reject incoming call
  const rejectCall = (reason = 'declined') => {
    soundEffects.stopRingtone();
    const callId = activeCallIdRef.current;
    const callerId = targetUserIdRef.current;

    if (callId && callerId && user) {
      const sendChannel = supabase.channel(`chatbase-call-${callerId}`);
      sendChannel.send({
        type: 'broadcast',
        event: 'call_reject',
        payload: { callId, fromId: user.id, reason },
      });
    }

    cleanupMediaAndTracks();
    setCallState('idle');
    setPartnerProfile(null);
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      triggerHaptics(10);
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      triggerHaptics(10);
    }
  };

  // Switch Camera between front and back
  const switchCamera = async () => {
    if (!localStreamRef.current || callType !== 'video') return;
    const nextFacing = !isFrontCamera;
    setIsFrontCamera(nextFacing);
    triggerHaptics(15);

    try {
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing ? 'user' : 'environment' },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && localStreamRef.current) {
        localStreamRef.current.removeTrack(currentVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack);

        // Update RTCPeerConnection sender
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        }
      }
    } catch (err) {
      console.warn('Switch camera failed:', err);
    }
  };

  // Toggle Minimized PiP mode
  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
    triggerHaptics(10);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        partnerProfile,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isFrontCamera,
        callDuration,
        isMinimized,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        toggleMinimize,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
