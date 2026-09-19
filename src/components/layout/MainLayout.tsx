import React, { useState, useEffect } from 'react';
import type { TabType } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { backNavigation } from '../../lib/backNavigation';
import { useBackButton } from '../../lib/useBackButton';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { HomeFeed } from '../home/HomeFeed';
import { ConversationList } from '../chat/ConversationList';
import { ChatWindow } from '../chat/ChatWindow';
import { UserSearch } from '../search/UserSearch';
import { ProfileView } from '../profile/ProfileView';
import { LocationPermissionModal } from '../auth/LocationPermissionModal';
import { SettingsModal } from '../settings/SettingsModal';

export const MainLayout: React.FC = () => {
  const { activeConversation, selectConversation } = useChat();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 900);

  // Initialize centralized hardware & browser back button handling
  useEffect(() => {
    backNavigation.init({ showToast });
  }, [showToast]);

  // Back handler for closing modals
  useBackButton(() => setShowLocationModal(false), showLocationModal, 90);
  useBackButton(() => setIsSettingsOpen(false), isSettingsOpen, 90);

  // Back handler for secondary tabs: return to 'chat' tab (priority 15)
  useBackButton(
    () => {
      setActiveTab('chat');
      return true;
    },
    activeTab !== 'chat',
    15
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if location permission prompt should be shown once
  useEffect(() => {
    const prompted = localStorage.getItem('chatbase_location_prompted');
    if (!prompted) {
      const timer = setTimeout(() => setShowLocationModal(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartChatFromOtherTab = () => {
    setActiveTab('chat');
  };

  const handleBackFromChat = () => {
    selectConversation(null);
  };

  const isInsideActiveChat = activeTab === 'chat' && Boolean(activeConversation);

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Desktop Navigation Sidebar */}
      {isDesktop && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (activeConversation) {
              selectConversation(null);
            }
            setActiveTab(tab);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Main Single-View Workspace Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Workspace Body */}
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex' }}>
          {/* 1. Home Tab */}
          {activeTab === 'home' && (
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <HomeFeed
                onStartChat={handleStartChatFromOtherTab}
                onExploreUsers={() => setActiveTab('search')}
              />
            </div>
          )}

          {/* 2. Chats Tab (List or Full Active Chat) */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex' }}>
              {!activeConversation ? (
                // Full Screen Conversation List
                <ConversationList onSelectTab={setActiveTab} />
              ) : (
                // Full Screen Chat Session with Message & Input bar
                <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ChatWindow
                    onBack={handleBackFromChat}
                    onViewProfile={() => {
                      selectConversation(null);
                      setActiveTab('profile');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. Search Tab */}
          {activeTab === 'search' && (
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <UserSearch
                onStartChat={handleStartChatFromOtherTab}
                onViewProfile={() => setActiveTab('profile')}
              />
            </div>
          )}

          {/* 4. Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <ProfileView />
            </div>
          )}
        </div>

        {/* Unified Bottom Box Navigation (Visible on mobile & desktop when not in active chat) */}
        {!isInsideActiveChat && (
          <BottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (activeConversation) {
                selectConversation(null);
              }
              setActiveTab(tab);
            }}
          />
        )}
      </div>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
