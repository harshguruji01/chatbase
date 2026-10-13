import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Smile,
  Mic,
  Send,
  Image as ImageIcon,
  Camera,
  Video,
  Heart,
  X,
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { InlineVoiceRecorder } from './InlineVoiceRecorder';
import { ImagePreviewModal } from './ImagePreviewModal';
import { VideoUploaderModal } from './VideoUploaderModal';
import { AppDownloadModal } from '../common/AppDownloadModal';
import { Capacitor } from '@capacitor/core';
import { useChat } from '../../context/ChatContext';
import { useBackButton } from '../../lib/useBackButton';
import { useToast } from '../common/Toast';
import { soundEffects } from '../../lib/soundEffects';

const QUICK_REPLIES = [
  '👍 Got it!',
  '❤️ Love this',
  '🔥 Amazing!',
  '📞 Call in 5m',
  '🙏 Thanks!',
  '✨ On my way',
  '🚀 Let\'s do it'
];

export const Composer: React.FC = () => {
  const { sendMessage, uploadProgress, broadcastTyping, replyToMessage, setReplyToMessage, activeConversation } = useChat();
  const { showToast } = useToast();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isRecordingInline, setIsRecordingInline] = useState(false);
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft when switching conversation
  useEffect(() => {
    if (!activeConversation) return;
    try {
      const draft = localStorage.getItem(`chatbase_draft_${activeConversation.id}`);
      if (draft) setText(draft);
      else setText('');
    } catch {}
  }, [activeConversation?.id]);

  // Persist draft in real-time
  useEffect(() => {
    if (!activeConversation) return;
    try {
      if (text.trim()) {
        localStorage.setItem(`chatbase_draft_${activeConversation.id}`, text);
      } else {
        localStorage.removeItem(`chatbase_draft_${activeConversation.id}`);
      }
    } catch {}
  }, [text, activeConversation?.id]);

  // Hardware/Browser Back Handlers for all child overlays in composer
  useBackButton(() => setShowActionsMenu(false), showActionsMenu, 60);
  useBackButton(() => setShowEmojiPicker(false), showEmojiPicker, 60);
  useBackButton(() => setIsRecordingInline(false), isRecordingInline, 70);
  useBackButton(() => setStagedImage(null), !!stagedImage, 80);
  useBackButton(() => setShowVideoModal(false), showVideoModal, 80);
  useBackButton(() => setShowDownloadModal(false), showDownloadModal, 90);

  const handleMicClick = () => {
    setShowActionsMenu(false);
    setIsRecordingInline(true);
  };

  // Auto-resize textarea as text grows & broadcast typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Broadcast typing indicator
    if (newText.trim().length > 0) {
      broadcastTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000);
    } else {
      broadcastTyping(false);
    }
  };

  // Ultra-Fast Non-Blocking Send: clears UI instantly without freezing input!
  const handleSendText = () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    broadcastTyping(false);

    if (activeConversation) {
      try {
        localStorage.removeItem(`chatbase_draft_${activeConversation.id}`);
      } catch {}
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    soundEffects.play('send');
    sendMessage({
      type: 'text',
      content,
    }).then((res) => {
      if (res?.error) {
        showToast(res.error, 'error');
        setText(content);
      }
    });
  };

  // 1-Tap Quick Reply Handler
  const handleSendQuickReply = (quickText: string) => {
    soundEffects.play('send');
    sendMessage({
      type: 'text',
      content: quickText,
    }).then((res) => {
      if (res?.error) {
        showToast(res.error, 'error');
      }
    });
  };

  const handleSendHeart = async () => {
    if (isSending) return;
    setIsSending(true);
    broadcastTyping(false);
    const res = await sendMessage({
      type: 'like',
      content: '❤️',
    });
    if (res?.error) {
      showToast(res.error, 'error');
    } else {
      soundEffects.play('send');
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleSendVoice = async (blob: Blob, durationSeconds: number) => {
    const res = await sendMessage({
      type: 'voice',
      mediaFile: blob,
      duration: durationSeconds,
    });
    if (res?.error) {
      showToast(res.error, 'error');
    }
    setIsRecordingInline(false);
  };

  const handleSendVideo = async (file: File) => {
    const res = await sendMessage({
      type: 'video',
      mediaFile: file,
    });
    if (res?.error) {
      showToast(res.error, 'error');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStagedImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleSendImage = async (file: File, caption: string) => {
    setStagedImage(null);
    const res = await sendMessage({
      type: 'image',
      mediaFile: file,
      content: caption,
    });
    if (res?.error) {
      showToast(res.error, 'error');
    }
  };

  // Support pasting images from clipboard (e.g. screenshots)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.items) {
      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setStagedImage(file);
            break;
          }
        }
      }
    }
  };

  return (
    <div className="ig-composer-container">
      {/* WhatsApp-style Quoted Reply Preview */}
      {replyToMessage && (
        <div
          className="fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #1E293B)',
            borderLeft: '4px solid var(--color-primary, #38BDF8)',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary, #38BDF8)', display: 'block' }}>
              Replying to {replyToMessage.sender?.display_name || 'Member'}
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary, rgba(255,255,255,0.7))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {replyToMessage.content || (replyToMessage.type === 'image' ? '📷 Photo' : replyToMessage.type === 'voice' ? '🎤 Voice note' : 'Message')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
            }}
            title="Cancel Reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Ultra-Fast Quick Reply Suggestion Chips */}
      {!isRecordingInline && !text.trim() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '2px 10px 8px 10px',
            scrollbarWidth: 'none',
          }}
          className="no-scrollbar"
        >
          {QUICK_REPLIES.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuickReply(chip)}
              style={{
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'var(--text-secondary, #cbd5e1)';
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Instagram Actions Drawer (+ Menu) */}
      {showActionsMenu && (
        <div className="ig-actions-menu ig-slide-up">
          {/* Gallery / Photos */}
          <button
            className="ig-menu-item"
            onClick={() => {
              setShowActionsMenu(false);
              imageInputRef.current?.click();
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <ImageIcon size={20} />
            </div>
            <span>Photos</span>
          </button>

          {/* Camera */}
          <button
            className="ig-menu-item"
            onClick={() => {
              setShowActionsMenu(false);
              cameraInputRef.current?.click();
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <Camera size={20} />
            </div>
            <span>Camera</span>
          </button>

          {/* Voice Note */}
          <button
            className="ig-menu-item"
            onClick={handleMicClick}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
              <Mic size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Voice Note</span>
              {!Capacitor.isNativePlatform() && (
                <span style={{ fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>
                  APK ONLY
                </span>
              )}
            </div>
          </button>

          {/* Video */}
          <button
            className="ig-menu-item"
            onClick={() => {
              setShowActionsMenu(false);
              setShowVideoModal(true);
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)' }}>
              <Video size={20} />
            </div>
            <span>Video</span>
          </button>

          {/* Stickers / Emojis */}
          <button
            className="ig-menu-item"
            onClick={() => {
              setShowActionsMenu(false);
              setShowEmojiPicker(true);
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <Smile size={20} />
            </div>
            <span>Stickers</span>
          </button>

          {/* Quick Heart / Like */}
          <button
            className="ig-menu-item"
            onClick={() => {
              setShowActionsMenu(false);
              handleSendHeart();
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
              <Heart size={20} fill="#ffffff" />
            </div>
            <span>Quick Like</span>
          </button>
        </div>
      )}

      {/* Inline Instagram Voice Recorder Mode */}
      {isRecordingInline ? (
        <InlineVoiceRecorder
          onSendVoice={handleSendVoice}
          onCancel={() => setIsRecordingInline(false)}
        />
      ) : (
        <>
          {/* Plus (+) Action Toggle Button */}
          <button
            type="button"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className={`ig-action-btn ${showActionsMenu ? 'plus-active' : ''}`}
            title="More actions"
          >
            <Plus size={22} />
          </button>

          {/* Capsule Text Input Pill */}
          <div className="ig-input-pill">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Message..."
              rows={1}
              className="ig-textarea"
            />

            {/* In-pill Emoji Picker Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                background: 'none',
                border: 'none',
                color: showEmojiPicker ? 'var(--color-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              title="Insert Emoji"
            >
              <Smile size={20} />
            </button>
          </div>

          {/* Right Action Icons or Send Button */}
          {text.trim().length > 0 ? (
            <button
              type="button"
              onClick={handleSendText}
              disabled={isSending}
              className="ig-send-btn fade-in-up"
              title="Send message"
            >
              <Send size={18} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {/* Direct Inline Mic Button */}
              <button
                type="button"
                onClick={handleMicClick}
                className="ig-action-btn"
                title={!Capacitor.isNativePlatform() ? 'Voice note (Download Android App)' : 'Voice note'}
                style={{ position: 'relative' }}
              >
                <Mic size={20} />
                {!Capacitor.isNativePlatform() && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                    }}
                  />
                )}
              </button>

              {/* Direct Gallery / Photo Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="ig-action-btn"
                title="Send photo"
              >
                <ImageIcon size={20} />
              </button>

              {/* Instagram Signature Quick Heart Button */}
              <button
                type="button"
                onClick={handleSendHeart}
                className="ig-action-btn"
                style={{ color: 'var(--color-danger)' }}
                title="Send heart"
              >
                <Heart size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Image Preview & Caption Modal */}
      <ImagePreviewModal
        isOpen={!!stagedImage}
        imageFile={stagedImage}
        onClose={() => setStagedImage(null)}
        onSendImage={handleSendImage}
      />

      {/* Video Uploader Modal */}
      <VideoUploaderModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSendVideo={handleSendVideo}
        uploadProgress={uploadProgress}
      />

      {/* Android Exclusive Feature Download Modal */}
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        feature="voice"
      />
    </div>
  );
};
