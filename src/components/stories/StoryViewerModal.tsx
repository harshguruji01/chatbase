import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { type Story } from '../../types/stories';
import { Avatar } from '../common/Avatar';
import { useBackButton } from '../../lib/useBackButton';
import { soundEffects } from '../../lib/soundEffects';
import confetti from 'canvas-confetti';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onReply?: (story: Story, text: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  isOpen,
  onClose,
  onReply,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useBackButton(onClose, isOpen, 85);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
    }
  }, [isOpen, initialIndex]);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) return;

    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const interval = 50; // update every 50ms
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, currentStory, isPaused, stories.length, onClose]);

  if (!isOpen || !currentStory) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleReaction = (emoji: string) => {
    soundEffects.play('reaction');

    // Burst confetti particles from bottom
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
    });

    if (onReply) {
      onReply(currentStory, `Reacted ${emoji} to your story!`);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    soundEffects.play('send');
    if (onReply) {
      onReply(currentStory, replyText.trim());
    }
    setReplyText('');
    onClose();
  };

  const formatStoryTime = (ts: number) => {
    const diffHours = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    return `${diffHours}h ago`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '92vh',
          maxHeight: '780px',
          background: currentStory.gradient,
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: '20px 24px',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bar Bars */}
        <div style={{ display: 'flex', gap: '4px', width: '100%', marginBottom: '16px' }}>
          {stories.map((s, idx) => {
            let fillPercent = 0;
            if (idx < currentIndex) fillPercent = 100;
            else if (idx === currentIndex) fillPercent = progress;

            return (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${fillPercent}%`,
                    background: '#FFFFFF',
                    transition: idx === currentIndex ? 'width 0.05s linear' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ border: '2px solid #FFFFFF', borderRadius: '50%', padding: '2px' }}>
              <Avatar src={currentStory.userAvatar} name={currentStory.userName} size="sm" />
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.92rem', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {currentStory.userName}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.72rem' }}>
                {formatStoryTime(currentStory.createdAt)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Story Content & Navigation Touch Targets */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '20px 0',
          }}
        >
          {/* Left tap zone */}
          <div
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer',
              zIndex: 5,
            }}
          />

          {/* Right tap zone */}
          <div
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer',
              zIndex: 5,
            }}
          />

          {/* Mood Emoji Bubble */}
          <div
            style={{
              fontSize: '3.5rem',
              marginBottom: '20px',
              filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
              animation: 'bounce 2s infinite ease-in-out',
            }}
          >
            {currentStory.moodEmoji}
          </div>

          {/* Story Text Box */}
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '1.35rem',
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.5,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              padding: '0 16px',
            }}
          >
            “{currentStory.text}”
          </div>
        </div>

        {/* Quick Reaction Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '14px',
            zIndex: 10,
          }}
        >
          {['❤️', '🔥', '👏', '😂', '😍'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply Box */}
        <form
          onSubmit={handleSendReply}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '999px',
            padding: '4px 6px 4px 16px',
            zIndex: 10,
          }}
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${currentStory.userName}...`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            style={{
              background: replyText.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              color: replyText.trim() ? '#4F46E5' : 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: replyText.trim() ? 'pointer' : 'default',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
