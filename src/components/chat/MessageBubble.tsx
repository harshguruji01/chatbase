import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Clock,
  Copy,
  Heart,
  Smile,
} from 'lucide-react';
import type { Message } from '../../types';
import {
  formatMessageTime,
  formatDuration,
  getDaysRemaining,
  copyToClipboard,
} from '../../lib/utils';
import { useToast } from '../common/Toast';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { ImageLightboxModal } from './ImageLightboxModal';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  isGroup?: boolean;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

// Global coordinator to prevent multiple voice notes from playing simultaneously
let globalActiveAudio: HTMLAudioElement | null = null;
let globalStopAudioCallback: (() => void) | null = null;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  isGroup = false,
  onDeleteMessage,
}) => {
  const { user } = useAuth();
  const { toggleReaction } = useChat();
  const { showToast } = useToast();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const daysRemaining = getDaysRemaining(message.expires_at);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Generate a consistent pseudo-random waveform pattern for this voice note
  const waveformHeights = useMemo(() => {
    const bars: number[] = [];
    let seed = 0;
    for (let i = 0; i < (message.id?.length || 10); i++) {
      seed = (seed * 31 + message.id.charCodeAt(i)) % 1000;
    }
    for (let i = 0; i < 24; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      bars.push(Math.round(6 + rnd * 18));
    }
    return bars;
  }, [message.id]);

  const toggleAudio = () => {
    if (!audioRef.current && message.media_url) {
      const audio = new Audio(message.media_url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
          setAudioCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        setAudioCurrentTime(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      };
    }

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        // Pause any other playing voice note
        if (globalActiveAudio && globalActiveAudio !== audioRef.current) {
          globalActiveAudio.pause();
          if (globalStopAudioCallback) globalStopAudioCallback();
        }
        globalActiveAudio = audioRef.current;
        globalStopAudioCallback = () => setIsPlayingAudio(false);

        // Reset if ended or at end
        if (audioRef.current.ended || (audioRef.current.duration && audioRef.current.currentTime >= audioRef.current.duration)) {
          audioRef.current.currentTime = 0;
          setAudioProgress(0);
          setAudioCurrentTime(0);
        }

        audioRef.current
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch((err) => {
            console.warn('Audio playback error:', err);
            setIsPlayingAudio(false);
          });
      }
    }
  };

  const handleSeekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current && message.media_url) {
      toggleAudio();
      return;
    }
    if (audioRef.current && audioRef.current.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      audioRef.current.currentTime = percentage * audioRef.current.duration;
      setAudioProgress(percentage * 100);
      setAudioCurrentTime(audioRef.current.currentTime);
      if (!isPlayingAudio) {
        if (globalActiveAudio && globalActiveAudio !== audioRef.current) {
          globalActiveAudio.pause();
          if (globalStopAudioCallback) globalStopAudioCallback();
        }
        globalActiveAudio = audioRef.current;
        globalStopAudioCallback = () => setIsPlayingAudio(false);

        audioRef.current
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch(console.warn);
      }
    }
  };

  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    toggleReaction(message.id, '❤️');
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 900);
  };

  const handleSelectReaction = (emoji: string) => {
    toggleReaction(message.id, emoji);
    setShowReactionPicker(false);
    setShowMenu(false);
  };

  const handleCopyText = async () => {
    if (message.content) {
      await copyToClipboard(message.content);
      showToast('Message copied to clipboard!', 'success');
      setShowMenu(false);
    }
  };

  // Group reactions by emoji
  const reactionCounts = useMemo(() => {
    if (!message.reactions) return [];
    const counts: Record<string, number> = {};
    Object.values(message.reactions).forEach((emoji) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return Object.entries(counts);
  }, [message.reactions]);

  const isLikedByMe = user && message.reactions && message.reactions[user.id] === '❤️';

  return (
    <div
      className={`message-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'} fade-in-up`}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Floating Instagram Heart Burst on Double-Tap */}
        {showHeartBurst && (
          <Heart
            size={72}
            className="ig-floating-heart"
            fill="#EC4899"
            color="#EC4899"
          />
        )}

        {/* Reaction Picker Bar (when opened from menu) */}
        {showReactionPicker && (
          <div
            className="ig-reactions-strip fade-in-up"
            style={{
              right: isOutgoing ? '0' : 'auto',
              left: isOutgoing ? 'auto' : '0',
            }}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Sender display in Group Chat for incoming messages */}
        {isGroup && !isOutgoing && message.sender && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
              paddingLeft: '6px',
            }}
          >
            <Avatar src={message.sender.avatar_url} name={message.sender.display_name} size="xs" />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {message.sender.display_name}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              @{message.sender.username}
            </span>
          </div>
        )}

        {/* Main Message Bubble */}
        <div
          className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
          onDoubleClick={handleDoubleTap}
          style={{
            background: message.type === 'like' ? 'transparent' : undefined,
            border: message.type === 'like' ? 'none' : undefined,
            boxShadow: message.type === 'like' ? 'none' : undefined,
            padding: message.type === 'image' ? '4px' : undefined,
            cursor: 'pointer',
          }}
        >
          {message.deleted_for_everyone ? (
            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
              🚫 This message was deleted
            </span>
          ) : (
            <>
              {/* Instagram Like / Pulsing Heart Message */}
              {message.type === 'like' && (
                <div style={{ padding: '8px', textAlign: 'center' }}>
                  <span className="ig-pulse-heart" style={{ fontSize: '3.6rem', lineHeight: 1 }}>
                    ❤️
                  </span>
                </div>
              )}

              {/* Photo / Image Message */}
              {message.type === 'image' && message.media_url && (
                <div
                  className="ig-image-bubble"
                  onClick={() => message.status !== 'sending' && setShowLightbox(true)}
                  style={{ position: 'relative' }}
                >
                  <img
                    src={message.media_url}
                    alt="Chat attachment"
                    loading="lazy"
                    style={message.status === 'sending' ? { filter: 'brightness(0.85)' } : undefined}
                  />
                  {message.status === 'sending' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.28)',
                        borderRadius: 'inherit',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          border: '3px solid rgba(255, 255, 255, 0.35)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    </div>
                  )}
                  {message.content && (
                    <p className="ig-image-caption">{message.content}</p>
                  )}
                </div>
              )}

              {/* Instagram-Style Voice Note Audio Player */}
              {message.type === 'voice' && message.media_url && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '220px',
                    maxWidth: '300px',
                    padding: '6px 4px',
                  }}
                >
                  {/* Play / Pause Circular Button */}
                  <button
                    onClick={toggleAudio}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: isOutgoing
                        ? 'rgba(255, 255, 255, 0.28)'
                        : 'var(--color-primary-light)',
                      border: 'none',
                      color: isOutgoing ? '#FFFFFF' : 'var(--color-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'transform 0.15s ease',
                    }}
                    title={isPlayingAudio ? 'Pause' : 'Play voice note'}
                  >
                    {isPlayingAudio ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  </button>

                  {/* Seekable Equalizer Waveform */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      onClick={handleSeekAudio}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        height: '24px',
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                      title="Click to scrub"
                    >
                      {waveformHeights.map((height, idx) => {
                        const barProgress = (idx / waveformHeights.length) * 100;
                        const isPlayed = audioProgress >= barProgress;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: '3px',
                              height: `${height}px`,
                              borderRadius: '2px',
                              background: isPlayed
                                ? isOutgoing
                                  ? '#FFFFFF'
                                  : 'var(--color-primary)'
                                : isOutgoing
                                ? 'rgba(255, 255, 255, 0.35)'
                                : 'var(--border-color-hover)',
                              transition: 'background 0.1s linear',
                            }}
                          />
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        opacity: 0.85,
                      }}
                    >
                      <span>
                        {isPlayingAudio
                          ? formatDuration(Math.floor(audioCurrentTime))
                          : formatDuration(message.media_duration || 0)}
                      </span>
                      <span>Voice note</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Message */}
              {message.type === 'video' && message.media_url && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', maxWidth: '300px', margin: '4px 0' }}>
                  <video
                    src={message.media_url}
                    controls
                    preload="metadata"
                    style={{ width: '100%', maxHeight: '240px', display: 'block', borderRadius: '12px' }}
                  />
                </div>
              )}

              {/* Normal Text / Emoji Message */}
              {message.content && message.type !== 'voice' && message.type !== 'image' && message.type !== 'like' && (
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {message.content}
                </p>
              )}
            </>
          )}

          {/* Reaction Badge (Attached to bottom of bubble) */}
          {reactionCounts.length > 0 && !message.deleted_for_everyone && (
            <div
              className="ig-reaction-badge"
              style={
                isLikedByMe
                  ? { borderColor: 'rgba(236, 72, 153, 0.5)', background: 'rgba(236, 72, 153, 0.12)' }
                  : undefined
              }
              onClick={() => toggleReaction(message.id, reactionCounts[0][0])}
              title="Click to react/remove"
            >
              {reactionCounts.map(([emoji, count]) => (
                <span key={emoji}>
                  {emoji} {count > 1 && count}
                </span>
              ))}
            </div>
          )}

          {/* Options Menu Trigger */}
          {!message.deleted_for_everyone && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                position: 'absolute',
                top: '4px',
                right: isOutgoing ? 'auto' : '-24px',
                left: isOutgoing ? '-24px' : 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                opacity: 0.6,
                padding: '2px',
              }}
              title="Options"
            >
              <MoreVertical size={14} />
            </button>
          )}

          {/* Context Options Dropdown */}
          {showMenu && (
            <div
              className="card fade-in-up"
              style={{
                position: 'absolute',
                top: '100%',
                right: isOutgoing ? '0' : 'auto',
                left: isOutgoing ? 'auto' : '0',
                padding: '6px',
                zIndex: 40,
                boxShadow: 'var(--shadow-lg)',
                minWidth: '160px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {/* React button */}
              <button
                onClick={() => {
                  setShowReactionPicker(true);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
              >
                <Smile size={14} /> React to message
              </button>

              {message.content && (
                <button
                  onClick={handleCopyText}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    fontSize: '0.85rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                >
                  <Copy size={14} /> Copy text
                </button>
              )}

              <button
                onClick={() => {
                  onDeleteMessage(message.id, false);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
              >
                <Trash2 size={14} /> Delete for me
              </button>

              {isOutgoing && (
                <button
                  onClick={() => {
                    onDeleteMessage(message.id, true);
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    fontSize: '0.85rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                >
                  <Trash2 size={14} /> Delete for everyone
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta: 30-day auto-expiry, timestamp & delivery status */}
      <div className={`message-meta ${isOutgoing ? 'outgoing' : 'incoming'}`}>
        <span className="message-expiry-badge" title="Auto-expires after 30 days">
          <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
          {daysRemaining > 0 ? `${daysRemaining}d` : 'exp'}
        </span>

        <span>{formatMessageTime(message.created_at)}</span>

        {isOutgoing && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '3px' }}>
            {message.status === 'sending' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  border: '1.5px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  opacity: 0.8,
                }}
                title="Sending..."
              />
            )}
            {message.status === 'sent' && <Check size={13} color="currentColor" />}
            {message.status === 'delivered' && <CheckCheck size={13} color="currentColor" />}
            {message.status === 'read' && <CheckCheck size={13} color="#38BDF8" />}
            {message.status === 'failed' && (
              <span style={{ color: '#EF4444', fontSize: '0.68rem', fontWeight: 700 }} title="Failed to send">
                !
              </span>
            )}
          </span>
        )}
      </div>

      {/* Lightbox for Image viewing */}
      {message.type === 'image' && message.media_url && (
        <ImageLightboxModal
          isOpen={showLightbox}
          imageUrl={message.media_url}
          caption={message.content}
          senderName={message.sender?.display_name}
          timestamp={formatMessageTime(message.created_at)}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
};
