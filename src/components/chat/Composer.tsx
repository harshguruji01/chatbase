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
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { InlineVoiceRecorder } from './InlineVoiceRecorder';
import { ImagePreviewModal } from './ImagePreviewModal';
import { VideoUploaderModal } from './VideoUploaderModal';
import { useChat } from '../../context/ChatContext';
import { useBackButton } from '../../lib/useBackButton';

export const Composer: React.FC = () => {
  const { sendMessage, uploadProgress, broadcastTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isRecordingInline, setIsRecordingInline] = useState(false);
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hardware/Browser Back Handlers for all child overlays in composer
  useBackButton(() => setShowActionsMenu(false), showActionsMenu, 60);
  useBackButton(() => setShowEmojiPicker(false), showEmojiPicker, 60);
  useBackButton(() => setIsRecordingInline(false), isRecordingInline, 70);
  useBackButton(() => setStagedImage(null), !!stagedImage, 80);
  useBackButton(() => setShowVideoModal(false), showVideoModal, 80);

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

  const handleSendText = async () => {
    if (!text.trim() || isSending) return;
    const content = text.trim();
    setText('');
    setIsSending(true);
    broadcastTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage({
      type: 'text',
      content,
    });
    setIsSending(false);
  };

  const handleSendHeart = async () => {
    if (isSending) return;
    setIsSending(true);
    broadcastTyping(false);
    await sendMessage({
      type: 'like',
      content: '❤️',
    });
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
    await sendMessage({
      type: 'voice',
      mediaFile: blob,
      duration: durationSeconds,
    });
    setIsRecordingInline(false);
  };

  const handleSendVideo = async (file: File) => {
    await sendMessage({
      type: 'video',
      mediaFile: file,
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStagedImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleSendImage = async (file: File, caption: string) => {
    await sendMessage({
      type: 'image',
      mediaFile: file,
      content: caption,
    });
    setStagedImage(null);
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
            onClick={() => {
              setShowActionsMenu(false);
              setIsRecordingInline(true);
            }}
          >
            <div className="ig-menu-item-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
              <Mic size={20} />
            </div>
            <span>Voice Note</span>
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
                onClick={() => setIsRecordingInline(true)}
                className="ig-action-btn"
                title="Voice note"
              >
                <Mic size={20} />
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
    </div>
  );
};
