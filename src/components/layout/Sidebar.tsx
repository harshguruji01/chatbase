import React from 'react';
import { Home, MessageSquare, Search, User, Moon, Sun, Laptop, Settings } from 'lucide-react';
import type { TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { BrandHeader } from '../common/BrandHeader';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenSettings }) => {
  const { profile } = useAuth();
  const { conversations } = useChat();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <div
      style={{
        width: '260px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <BrandHeader size="md" />
      </div>

      {/* Navigation Buttons */}
      <div className="desktop-nav-menu" style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* 1. Home */}
        <button
          className={`desktop-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <Home size={20} />
          <span>{t('home')}</span>
        </button>

        {/* 2. Chats */}
        <button
          className={`desktop-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <MessageSquare size={20} />
            {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
          </div>
          <span>{t('chats')}</span>
        </button>

        {/* 3. Search */}
        <button
          className={`desktop-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onSelectTab('search')}
        >
          <Search size={20} />
          <span>{t('search')}</span>
        </button>

        {/* 4. Profile */}
        <button
          className={`desktop-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <User size={20} />
          <span>{t('profile')}</span>
        </button>

        {/* Settings */}
        {onOpenSettings && (
          <button
            className="desktop-nav-btn"
            onClick={onOpenSettings}
            title={t('settings')}
          >
            <Settings size={20} />
            <span>{t('settings')}</span>
          </button>
        )}
      </div>

      {/* Bottom Profile Bar */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
          onClick={() => onSelectTab('profile')}
        >
          <Avatar src={profile?.avatar_url} name={profile?.display_name || 'Me'} size="sm" isOnline />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.display_name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {profile?.user_code}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Laptop size={18} />}
        </button>
      </div>
    </div>
  );
};
