import React, { useState, useEffect } from 'react';
import type { TabType } from '../../types';
import { useChat } from '../../context/ChatContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ConversationList } from '../chat/ConversationList';
import { ChatWindow } from '../chat/ChatWindow';
import { NearbyDiscovery } from '../nearby/NearbyDiscovery';
import { UserSearch } from '../search/UserSearch';
import { ProfileView } from '../profile/ProfileView';
import { LocationPermissionModal } from '../auth/LocationPermissionModal';
import { BrandHeader } from '../common/BrandHeader';

interface MainLayoutProps {
  onGoToAdmin: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onGoToAdmin }) => {
  const { activeConversation, selectConversation } = useChat();

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if location permission prompt should be shown
  useEffect(() => {
    const prompted = localStorage.getItem('chatbase_location_prompted');
    if (!prompted) {
      const timer = setTimeout(() => setShowLocationModal(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartChatFromOtherTab = () => {
    setActiveTab('chat');
  };

  const handleBackFromChat = () => {
    selectConversation(null);
  };

  return (
    <div className="app-layout">
      {/* Desktop Main Navigation Sidebar */}
      {isDesktop && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
          }}
          onGoToAdmin={onGoToAdmin}
        />
      )}

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* If Active Tab is Chat */}
        {activeTab === 'chat' && (
          <>
            {/* Conversations Column */}
            {(!activeConversation || isDesktop) && (
              <div
                className="sidebar-container active-mobile"
                style={{
                  width: isDesktop ? '360px' : '100%',
                  borderRight: '1px solid var(--border-color)',
                }}
              >
                {!isDesktop && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <BrandHeader size="sm" showSubtitle={false} />
                  </div>
                )}
                <ConversationList onSelectTab={setActiveTab} />
              </div>
            )}

            {/* Chat Window Column */}
            {(activeConversation || isDesktop) && (
              <div
                className={`main-content-container ${!activeConversation && !isDesktop ? 'hidden-mobile' : ''}`}
              >
                <ChatWindow
                  onBack={!isDesktop ? handleBackFromChat : undefined}
                  onViewProfile={() => setActiveTab('profile')}
                />
              </div>
            )}
          </>
        )}

        {/* If Active Tab is Nearby */}
        {activeTab === 'nearby' && (
          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <NearbyDiscovery
              onStartChat={handleStartChatFromOtherTab}
              onViewProfile={() => setActiveTab('profile')}
            />
          </div>
        )}

        {/* If Active Tab is Search */}
        {activeTab === 'search' && (
          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <UserSearch
              onStartChat={handleStartChatFromOtherTab}
              onViewProfile={() => setActiveTab('profile')}
            />
          </div>
        )}

        {/* If Active Tab is Profile */}
        {activeTab === 'profile' && (
          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <ProfileView onGoToAdmin={onGoToAdmin} />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Shown only when not inside active mobile chat) */}
      {!isDesktop && !activeConversation && (
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      )}

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
