import React from 'react';
import { MessageSquare, Compass, Search, User, ShieldAlert, Moon, Sun, Laptop } from 'lucide-react';
import type { TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandHeader } from '../common/BrandHeader';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onGoToAdmin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onGoToAdmin }) => {
  const { profile, isAdmin } = useAuth();
  const { conversations } = useChat();
  const { theme, setTheme } = useTheme();

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
      <div className="desktop-nav-menu" style={{ flex: 1 }}>
        <button
          className={`desktop-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <MessageSquare size={20} />
            {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
          </div>
          <span>Messages</span>
        </button>

        <button
          className={`desktop-nav-btn ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => onSelectTab('nearby')}
        >
          <Compass size={20} />
          <span>Discover Nearby</span>
        </button>

        <button
          className={`desktop-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onSelectTab('search')}
        >
          <Search size={20} />
          <span>Find by ID</span>
        </button>

        <button
          className={`desktop-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <User size={20} />
          <span>My Profile</span>
        </button>

        <button
          className="desktop-nav-btn"
          onClick={onGoToAdmin}
          style={{
            color: isAdmin ? 'var(--color-primary)' : 'var(--text-muted)',
            marginTop: '8px',
            background: isAdmin ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
          }}
          title={isAdmin ? 'Admin Dashboard (Active)' : 'Admin Console (PIN Protected)'}
        >
          <ShieldAlert size={20} />
          <span>{isAdmin ? 'Admin Panel' : 'Admin Portal'}</span>
        </button>
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
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
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
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Laptop size={18} />}
        </button>
      </div>
    </div>
  );
};
