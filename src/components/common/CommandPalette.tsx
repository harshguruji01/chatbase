import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  Sparkles,
  User,
  Settings,
  Compass,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  PlusCircle,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useBackButton } from '../../lib/useBackButton';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { soundEffects } from '../../lib/soundEffects';
import type { TabType } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onOpenAI: () => void;
  onOpenSettings: () => void;
  onOpenCreateGroup?: () => void;
}

interface CommandAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'Tools' | 'Preferences';
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAI,
  onOpenSettings,
  onOpenCreateGroup,
}) => {
  const { theme, setTheme } = useTheme();
  const { conversations, selectConversation } = useChat();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useBackButton(onClose, isOpen, 95);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      soundEffects.play('pop');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const soundOn = soundEffects.isEnabled();

  const baseActions: CommandAction[] = [
    {
      id: 'ai_assistant',
      title: 'GuruJi AI Assistant',
      subtitle: 'Ask AI, draft messages, or translate content',
      icon: <Sparkles size={18} color="#8B5CF6" />,
      category: 'Tools',
      perform: () => {
        onClose();
        onOpenAI();
      },
    },
    {
      id: 'tab_chat',
      title: 'Go to Chats',
      subtitle: 'View your conversations & active messages',
      icon: <MessageSquare size={18} color="#6366F1" />,
      category: 'Navigation',
      perform: () => {
        onClose();
        onSelectTab('chat');
      },
    },
    {
      id: 'tab_search',
      title: 'Find People & Radar Nearby',
      subtitle: 'Discover nearby users and search by Unique ID',
      icon: <Compass size={18} color="#10B981" />,
      category: 'Navigation',
      perform: () => {
        onClose();
        onSelectTab('search');
      },
    },
    {
      id: 'tab_profile',
      title: 'My Profile',
      subtitle: 'View your bio, user code, and account stats',
      icon: <User size={18} color="#0EA5E9" />,
      category: 'Navigation',
      perform: () => {
        onClose();
        onSelectTab('profile');
      },
    },
    {
      id: 'create_group',
      title: 'Create New Group',
      subtitle: 'Start a collaborative group conversation',
      icon: <PlusCircle size={18} color="#EC4899" />,
      category: 'Tools',
      perform: () => {
        onClose();
        if (onOpenCreateGroup) onOpenCreateGroup();
      },
    },
    {
      id: 'toggle_theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Current theme: ${theme}`,
      icon: theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#8B5CF6" />,
      category: 'Preferences',
      perform: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        soundEffects.play('click');
        onClose();
      },
    },
    {
      id: 'toggle_sound',
      title: `${soundOn ? 'Mute' : 'Enable'} Sound Effects`,
      subtitle: `Web Audio sound synthesizer: ${soundOn ? 'Active' : 'Muted'}`,
      icon: soundOn ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} color="#10B981" />,
      category: 'Preferences',
      perform: () => {
        soundEffects.toggle();
        onClose();
      },
    },
    {
      id: 'open_settings',
      title: 'Account Settings',
      subtitle: 'Privacy, password, language, and preferences',
      icon: <Settings size={18} color="#94A3B8" />,
      category: 'Preferences',
      perform: () => {
        onClose();
        onOpenSettings();
      },
    },
  ];

  // Also include conversations if user is searching
  const conversationActions: CommandAction[] = conversations.map((c) => ({
    id: `conv_${c.id}`,
    title: c.title || 'Chat',
    subtitle: c.last_message_text || 'Open conversation',
    icon: <MessageSquare size={18} color="var(--color-primary)" />,
    category: 'Navigation',
    perform: () => {
      onClose();
      onSelectTab('chat');
      selectConversation(c);
    },
  }));

  const allActions = [...baseActions, ...conversationActions];

  const filteredActions = allActions.filter((a) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '65vh',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="fade-in-up"
      >
        {/* Search Input Box */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-input)',
          }}
        >
          <Search size={20} color="var(--color-primary)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search chats, or navigate..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: 500,
              outline: 'none',
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {filteredActions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No commands or chats found matching "{query}"
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => action.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {action.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {action.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft size={16} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ChatBase Command Center</span>
        </div>
      </div>
    </div>
  );
};
