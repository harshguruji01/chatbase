import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  Search,
  User,
  Moon,
  Sun,
  Laptop,
  Settings,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { BrandHeader } from '../common/BrandHeader';
import { Avatar } from '../common/Avatar';
import { AppDownloadModal } from '../common/AppDownloadModal';
import { soundEffects } from '../../lib/soundEffects';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenSettings?: () => void;
  onOpenAI?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenAI,
  onOpenCommandPalette,
}) => {
  const { profile } = useAuth();
  const { conversations } = useChat();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const toggleTheme = () => {
    soundEffects.play('click');
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const toggleSound = () => {
    const next = soundEffects.toggle();
    setSoundEnabled(next);
  };

  return (
    <div
      style={{
        width: '270px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Brand Header & Live Online Indicator */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-color)' }}>
        <BrandHeader size="md" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '10px',
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            fontSize: '0.74rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                boxShadow: '0 0 8px var(--color-success)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Live Network</span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>2.4k+ Online</span>
        </div>
      </div>

      {/* Quick Command Launcher (Ctrl + K) */}
      {onOpenCommandPalette && (
        <div style={{ padding: '10px 12px 2px' }}>
          <button
            onClick={() => {
              soundEffects.play('click');
              onOpenCommandPalette();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={15} color="var(--color-primary)" />
              <span>Quick Action</span>
            </div>
            <kbd
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="desktop-nav-menu" style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {/* 1. Home */}
        <button
          className={`desktop-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.play('click');
            onSelectTab('home');
          }}
        >
          <Home size={19} />
          <span>{t('home')}</span>
        </button>

        {/* 2. Chats */}
        <button
          className={`desktop-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.play('click');
            onSelectTab('chat');
          }}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <MessageSquare size={19} />
            {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
          </div>
          <span>{t('chats')}</span>
        </button>

        {/* 3. Search & Nearby */}
        <button
          className={`desktop-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.play('click');
            onSelectTab('search');
          }}
        >
          <Search size={19} />
          <span>{t('search')}</span>
        </button>

        {/* 4. Profile */}
        <button
          className={`desktop-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.play('click');
            onSelectTab('profile');
          }}
        >
          <User size={19} />
          <span>{t('profile')}</span>
        </button>

        {/* 5. GuruJi AI Copilot */}
        {onOpenAI && (
          <button
            className="desktop-nav-btn"
            onClick={() => {
              soundEffects.play('pop');
              onOpenAI();
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--color-primary)',
              marginTop: '4px',
            }}
          >
            <Sparkles size={19} color="#8B5CF6" />
            <span style={{ fontWeight: 700 }}>GuruJi AI</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '999px',
                background: 'var(--color-primary)',
                color: '#FFF',
              }}
            >
              PRO
            </span>
          </button>
        )}

        {/* 6. Settings */}
        {onOpenSettings && (
          <button
            className="desktop-nav-btn"
            onClick={() => {
              soundEffects.play('click');
              onOpenSettings();
            }}
            title={t('settings')}
          >
            <Settings size={19} />
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
            HarshGuruJi Network
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

      {/* Bottom Profile & Preference Bar */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-app)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
          onClick={() => {
            soundEffects.play('click');
            onSelectTab('profile');
          }}
        >
          <Avatar src={profile?.avatar_url} name={profile?.display_name || 'Me'} size="sm" isOnline />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.display_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {profile?.user_code}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            style={{
              background: 'none',
              border: 'none',
              color: soundEnabled ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Moon size={17} /> : theme === 'light' ? <Sun size={17} /> : <Laptop size={17} />}
          </button>
        </div>
      </div>

      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        feature="general"
      />
    </div>
  );
};
