import React, { useState, useRef } from 'react';
import { Check, CheckCheck, Play, Pause, MoreVertical, Trash2, Clock, Copy } from 'lucide-react';
import type { Message } from '../../types';
import { formatMessageTime, formatDuration, getDaysRemaining, copyToClipboard } from '../../lib/utils';
import { useToast } from '../common/Toast';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  onDeleteMessage,
}) => {
  const { showToast } = useToast();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const daysRemaining = getDaysRemaining(message.expires_at);

  const toggleAudio = () => {
    if (!audioRef.current && message.media_url) {
      const audio = new Audio(message.media_url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleCopyText = async () => {
    if (message.content) {
      await copyToClipboard(message.content);
      showToast('Message copied to clipboard!', 'success');
      setShowMenu(false);
    }
  };

  return (
    <div className={`message-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'} fade-in-up`}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
          {message.deleted_for_everyone ? (
            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
              🚫 This message was deleted
            </span>
          ) : (
            <>
              {/* Voice Message */}
              {message.type === 'voice' && message.media_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', padding: '4px 0' }}>
                  <button
                    onClick={toggleAudio}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isOutgoing ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-primary-light)',
                      border: 'none',
                      color: isOutgoing ? '#FFFFFF' : 'var(--color-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      style={{
                        height: '4px',
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${audioProgress}%`,
                          background: isOutgoing ? '#FFFFFF' : 'var(--color-primary)',
                          transition: 'width 0.1s linear',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                      {formatDuration(message.media_duration || 0)}
                    </span>
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

              {/* Normal / Emoji Text Message */}
              {message.content && message.type !== 'voice' && (
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {message.content}
                </p>
              )}
            </>
          )}

          {/* Action Menu Trigger Button */}
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
              title="Message options"
            >
              <MoreVertical size={14} />
            </button>
          )}

          {/* Context Dropdown Menu */}
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
                minWidth: '150px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
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

      {/* Meta: Expiry countdown, timestamp & delivery ticks */}
      <div className={`message-meta ${isOutgoing ? 'outgoing' : 'incoming'}`}>
        <span className="message-expiry-badge" title="Auto-expires after 30 days">
          <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
          {daysRemaining > 0 ? `${daysRemaining}d` : 'exp'}
        </span>

        <span>{formatMessageTime(message.created_at)}</span>

        {isOutgoing && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
            {message.status === 'sent' && <Check size={13} color="currentColor" />}
            {message.status === 'delivered' && <CheckCheck size={13} color="currentColor" />}
            {message.status === 'read' && <CheckCheck size={13} color="#38BDF8" />}
          </span>
        )}
      </div>
    </div>
  );
};
