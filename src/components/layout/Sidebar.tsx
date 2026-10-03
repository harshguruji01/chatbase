import React, { useState } from 'react';
import { Home, MessageSquare, Search, User, Moon, Sun, Laptop, Settings, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { BrandHeader } from '../common/BrandHeader';
import { Avatar } from '../common/Avatar';
import { AppDownloadModal } from '../common/AppDownloadModal';

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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
        {/* Get Android App (Web Only) */}
        {!Capacitor.isNativePlatform() && (
          <div style={{ marginTop: 'auto', padding: '6px 4px 2px' }}>
            <button
              onClick={() => setShowDownloadModal(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.18))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Smartphone size={20} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  Get Android App
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Unlock Voice & Radar
                </div>
              </div>
            </button>
          </div>
        )}

        {/* WebGuruJi Network Links */}
        <div style={{ padding: '8px 4px 4px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px' }}>
            WebGuruJi Network
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <a
              href="https://books.webguruji.online"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              📚 Books
            </a>
            <a
              href="https://store.webguruji.online"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              🛍️ Store
            </a>
            <a
              href="https://www.webguruji.online"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              🌐 Main ↗
            </a>
          </div>
        </div>
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

      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        feature="general"
      />
    </div>
  );
};
