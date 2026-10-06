import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Copy, Check, X } from 'lucide-react';
import { useBackButton } from '../../lib/useBackButton';
import { useToast } from '../common/Toast';
import { copyToClipboard } from '../../lib/utils';
import { soundEffects } from '../../lib/soundEffects';

interface NoteItem {
  id: string;
  text: string;
  createdAt: number;
}

interface SavedNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedNotesModal: React.FC<SavedNotesModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('chatbase_saved_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'n1',
        text: 'Welcome to your Saved Notes! 📌\nUse this personal space to save links, thoughts, code snippets, or to-dos.',
        createdAt: Date.now() - 3600000,
      },
    ];
  });
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useBackButton(onClose, isOpen, 70);

  useEffect(() => {
    localStorage.setItem('chatbase_saved_notes', JSON.stringify(notes));
  }, [notes]);

  if (!isOpen) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundEffects.play('pop');
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      text: inputText.trim(),
      createdAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setInputText('');
    showToast('Saved to notes!', 'success');
  };

  const handleDelete = (id: string) => {
    soundEffects.play('click');
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Note deleted', 'info');
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    soundEffects.play('click');
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
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
          maxWidth: '540px',
          height: '80vh',
          maxHeight: '680px',
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #0EA5E9)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bookmark size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Saved Messages & Notes
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Personal scratchpad & quick reminders
              </p>
            </div>
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

        {/* Notes List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--bg-app)',
          }}
        >
          {notes.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No saved notes yet. Type below to save your first note! 📝
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                }}
              >
                <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {note.text}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '6px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopy(note.id, note.text)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === note.id ? 'var(--color-success)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copiedId === note.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleAddNote}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a note, link, or to-do..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: inputText.trim() ? 'var(--color-primary)' : 'var(--bg-input)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>Save</span>
          </button>
        </form>
      </div>
    </div>
  );
};
