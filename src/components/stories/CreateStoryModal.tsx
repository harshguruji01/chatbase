import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { type Story, STORY_GRADIENTS } from '../../types/stories';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { useBackButton } from '../../lib/useBackButton';
import { soundEffects } from '../../lib/soundEffects';
import confetti from 'canvas-confetti';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStory: (story: Story) => void;
}

const EMOJI_OPTIONS = ['🔥', '✨', '🚀', '☕', '💻', '🌿', '🎧', '🌟', '🎯', '😄'];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onAddStory,
}) => {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(STORY_GRADIENTS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('✨');

  useBackButton(onClose, isOpen, 80);

  if (!isOpen) return null;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast('Please write something for your story!', 'error');
      return;
    }

    const newStory: Story = {
      id: `self_${Date.now()}`,
      userId: profile?.id || 'me',
      userName: profile?.display_name || 'Me',
      userAvatar: profile?.avatar_url,
      text: text.trim(),
      moodEmoji: selectedEmoji,
      gradient: selectedGradient,
      createdAt: Date.now(),
      likesCount: 0,
      isSelf: true,
    };

    onAddStory(newStory);
    soundEffects.play('pop');

    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast('Your status story has been published! 🎉', 'success');
    setText('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        className="fade-in-up"
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Add to Story / Status
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              height: '180px',
              borderRadius: '16px',
              background: selectedGradient,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{selectedEmoji}</div>
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1.4,
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                wordBreak: 'break-word',
                maxHeight: '80px',
                overflow: 'hidden',
              }}
            >
              {text.trim() || 'What is on your mind today?'}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '12px',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              Live Preview
            </div>
          </div>

          {/* Text input */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Your Status Message
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a thought, quote, or what you're working on..."
              rows={3}
              maxLength={120}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {text.length}/120
            </div>
          </div>

          {/* Mood Emoji selector */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Pick Mood / Emoji
            </label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  style={{
                    fontSize: '1.25rem',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: selectedEmoji === emoji ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: selectedEmoji === emoji ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Background Gradient selector */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Background Style
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {STORY_GRADIENTS.map((grad, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedGradient(grad)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: grad,
                    border: selectedGradient === grad ? '2px solid #FFFFFF' : 'none',
                    boxShadow: selectedGradient === grad ? '0 0 0 2px var(--color-primary)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedGradient === grad && <Check size={14} color="#FFF" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!text.trim()}
            className="btn btn-primary btn-sm"
          >
            Share to Story
          </button>
        </div>
      </div>
    </div>
  );
};
