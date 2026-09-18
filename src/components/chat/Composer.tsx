import React, { useState, useRef, useEffect } from 'react';
import { Plus, Smile, Mic, Send, Video } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { VideoUploaderModal } from './VideoUploaderModal';
import { useChat } from '../../context/ChatContext';

export const Composer: React.FC = () => {
  const { sendMessage, uploadProgress } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSendText = async () => {
    if (!text.trim() || isSending) return;
    const content = text.trim();
    setText('');
    setIsSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage({
      type: 'text',
      content,
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
  };

  const handleSendVideo = async (file: File) => {
    await sendMessage({
      type: 'video',
      mediaFile: file,
    });
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        position: 'relative',
      }}
    >
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Attachments Menu */}
      {showAttachMenu && (
        <div
          className="card fade-in-up"
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '12px',
            padding: '8px',
            zIndex: 40,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '160px',
          }}
        >
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setShowVideoModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              fontSize: '0.9rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            <Video size={18} color="var(--color-primary)" />
            <span>Send Video</span>
          </button>
        </div>
      )}

      {/* Attach / Plus Button */}
      <button
        type="button"
        onClick={() => setShowAttachMenu(!showAttachMenu)}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          background: showAttachMenu ? 'var(--bg-card-hover)' : 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: showAttachMenu ? 'rotate(45deg)' : 'none',
        }}
        title="Attach Media"
      >
        <Plus size={20} />
      </button>

      {/* Textarea Input Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '24px',
          padding: '6px 12px',
          minHeight: '40px',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            lineHeight: 1.4,
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />

        {/* Emoji Button */}
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
          }}
          title="Insert Emoji"
        >
          <Smile size={20} />
        </button>
      </div>

      {/* Voice Recorder or Send Button */}
      {text.trim().length > 0 ? (
        <button
          type="button"
          onClick={handleSendText}
          disabled={isSending}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.1s',
          }}
          title="Send message"
        >
          <Send size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowVoiceModal(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.1s',
          }}
          title="Record voice note"
        >
          <Mic size={20} />
        </button>
      )}

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSendVoice={handleSendVoice}
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
