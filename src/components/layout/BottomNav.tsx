import React from 'react';
import { MessageSquare, Compass, Search, User } from 'lucide-react';
import type { TabType } from '../../types';
import { useChat } from '../../context/ChatContext';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { conversations } = useChat();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onSelectTab('chat')}
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={22} />
          {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
        </div>
        <span>Chat</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'nearby' ? 'active' : ''}`}
        onClick={() => onSelectTab('nearby')}
      >
        <Compass size={22} />
        <span>Nearby</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onSelectTab('search')}
      >
        <Search size={22} />
        <span>Search</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onSelectTab('profile')}
      >
        <User size={22} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
