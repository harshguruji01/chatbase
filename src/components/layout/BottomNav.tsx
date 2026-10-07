import React from 'react';
import { Home, MessageSquare, Search, User, Crown } from 'lucide-react';
import type { TabType } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePremium } from '../../context/PremiumContext';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { conversations } = useChat();
  const { t } = useLanguage();
  const { isPremium } = usePremium();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <nav className="bottom-nav">
      {/* 1. Home Box */}
      <button
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
        title={t('home')}
      >
        <Home size={22} />
        <span>{t('home')}</span>
      </button>

      {/* 2. Chats Box */}
      <button
        className={`bottom-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onSelectTab('chat')}
        title={t('chats')}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <MessageSquare size={22} />
          {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
        </div>
        <span>{t('chats')}</span>
      </button>

      {/* 3. Search Box */}
      <button
        className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onSelectTab('search')}
        title={t('search')}
      >
        <Search size={22} />
        <span>{t('search')}</span>
      </button>

      {/* 4. Profile Box */}
      <button
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onSelectTab('profile')}
        title={t('profile')}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <User size={22} />
          {isPremium && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--bg-card)',
                boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
              }}
            >
              <Crown size={8} color="#fff" />
            </span>
          )}
        </div>
        <span>{t('profile')}</span>
      </button>
    </nav>
  );
};
