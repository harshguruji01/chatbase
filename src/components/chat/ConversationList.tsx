import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Users, MessageCircle, X, Sparkles, AlertCircle, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../common/Toast';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { Modal } from '../common/Modal';
import { formatRelativeTime } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useBackButton } from '../../lib/useBackButton';
import type { TabType, Profile, Conversation } from '../../types';
import { BrandHeader } from '../common/BrandHeader';
import { CreateGroupModal } from './CreateGroupModal';

interface ConversationListProps {
  onSelectTab: (tab: TabType) => void;
  onViewProfile?: (userId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectTab: _onSelectTab, onViewProfile }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    startChatWithUser,
    clearChat,
    deleteConversation,
    isUserBlocked,
    isLoadingConversations,
  } = useChat();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [searchFilter, setSearchFilter] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Conversation options & clear/delete modal states
  const [convToManage, setConvToManage] = useState<Conversation | null>(null);
  const [showConvOptionsModal, setShowConvOptionsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isProcessingConv, setIsProcessingConv] = useState(false);

  useBackButton(() => setShowConvOptionsModal(false), showConvOptionsModal, 45);
  useBackButton(() => setShowClearConfirmModal(false), showClearConfirmModal, 50);
  useBackButton(() => setShowDeleteConfirmModal(false), showDeleteConfirmModal, 50);

  const handleConfirmClearChat = async () => {
    if (!convToManage) return;
    setIsProcessingConv(true);
    try {
      const { error } = await clearChat(convToManage.id);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Chat cleared from your device', 'success');
        setShowClearConfirmModal(false);
        setConvToManage(null);
      }
    } finally {
      setIsProcessingConv(false);
    }
  };

  const handleConfirmDeleteConv = async () => {
    if (!convToManage) return;
    setIsProcessingConv(true);
    try {
      const { error } = await deleteConversation(convToManage.id);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Conversation removed from your device', 'success');
        setShowDeleteConfirmModal(false);
        setConvToManage(null);
      }
    } finally {
      setIsProcessingConv(false);
    }
  };

  // Users search state
  const [userSearchResults, setUserSearchResults] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

  // Suggested users list (for quick chat tray & empty state recommendations)
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load active/suggested users from profiles on mount
  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(12);

        if (!error && data) {
          setSuggestedUsers(data as Profile[]);
        }
      } catch (err) {
        console.warn('Could not load suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [user]);

  // 2. Debounced search for global users when searchFilter is typed
  useEffect(() => {
    const q = searchFilter.trim().replace(/^@/, '');
    if (!q || !user) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .or(`user_code.ilike.%${q}%,username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(15);

        if (!error && data) {
          setUserSearchResults(data as Profile[]);
        } else {
          setUserSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching users on chat page:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchFilter, user]);

  // Start chat with user from the list
  const handleStartChatWithTarget = async (targetUser: Profile) => {
    setStartingChatUserId(targetUser.id);
    try {
      const { error } = await startChatWithUser(targetUser);
      if (error) {
        showToast(error, 'error');
      } else {
        setSearchFilter('');
      }
    } finally {
      setStartingChatUserId(null);
    }
  };

  // Filter existing conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    if (c.is_group) {
      return (
        c.title?.toLowerCase().includes(q) ||
        c.last_message_text?.toLowerCase().includes(q)
      );
    }
    const other = c.other_member;
    return (
      other?.display_name?.toLowerCase().includes(q) ||
      other?.username?.toLowerCase().includes(q) ||
      other?.user_code?.toLowerCase().includes(q) ||
      c.last_message_text?.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const isSearching = searchFilter.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--bg-app)' }}>
      {/* Top Header */}
      <div
        style={{
          padding: '14px 16px',
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandHeader size="sm" showSubtitle={false} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* New Group Button */}
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--color-primary), #EC4899)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                transition: 'transform 0.15s ease',
              }}
              title="Create New Group Chat"
            >
              <Users size={14} />
              <span>+ Group</span>
            </button>

            {totalUnread > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {totalUnread} new
              </span>
            )}
          </div>
        </div>

        {/* Global Chat Search Input */}
        <div className="input-wrapper">
          <Search size={16} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder={t('search_placeholder') || 'Search chats, ID, username...'}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 38px 10px 38px', fontSize: '0.92rem' }}
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="input-icon-right"
              style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Clear Search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Horizontal Active / Quick Chat Tray (when not actively searching) */}
        {!isSearching && suggestedUsers.length > 0 && (
          <div
            style={{
              padding: '12px 16px 14px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Quick Chat
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {suggestedUsers.length} people
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              {suggestedUsers.map((targetUser) => {
                const isSelected = activeConversation?.other_member?.id === targetUser.id;
                const isStarting = startingChatUserId === targetUser.id;

                return (
                  <div
                    key={targetUser.id}
                    onClick={() => handleStartChatWithTarget(targetUser)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      width: '62px',
                    }}
                    title={`Chat with ${targetUser.display_name}`}
                  >
                    <div
                      style={{
                        position: 'relative',
                        padding: '2px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Avatar
                        src={targetUser.avatar_url}
                        name={targetUser.display_name}
                        size="md"
                        isOnline={targetUser.show_online_status}
                      />
                      {isStarting && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div className="spinner" style={{ width: '16px', height: '16px' }} />
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        maxWidth: '62px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      {targetUser.display_name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH MODE: Display Matching Chats AND Global Users below the Search Bar */}
        {isSearching ? (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Matching Existing Chats */}
            {filteredConversations.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Existing Chats ({filteredConversations.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredConversations.map((conv) => {
                    const isGroup = conv.is_group;
                    const other = conv.other_member;
                    const isSelected = activeConversation?.id === conv.id;
                    const displayTitle = isGroup ? (conv.title || 'Group Chat') : (other?.display_name || 'User');

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          selectConversation(conv);
                          setSearchFilter('');
                        }}
                        className={`conversation-item ${isSelected ? 'selected' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {isGroup ? (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: conv.avatar_url
                                ? `url(${conv.avatar_url}) center / cover no-repeat`
                                : 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {!conv.avatar_url && <Users size={20} />}
                          </div>
                        ) : (
                          <Avatar
                            src={other?.avatar_url}
                            name={other?.display_name || 'User'}
                            size="md"
                            isOnline={other?.show_online_status}
                          />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayTitle}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.last_message_text || 'Active chat'}
                          </div>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          Open →
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Matching Global Users (Listed directly under search bar) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Users by ID or Name {userSearchResults.length > 0 && `(${userSearchResults.length})`}
                </span>
                {isSearchingUsers && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Searching...</span>
                )}
              </div>

              {isSearchingUsers ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="card skeleton" style={{ height: '64px', borderRadius: 'var(--radius-md)' }} />
                  ))}
                </div>
              ) : userSearchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {userSearchResults.map((targetUser) => {
                    const blocked = isUserBlocked(targetUser.id);
                    const isStarting = startingChatUserId === targetUser.id;

                    return (
                      <div
                        key={targetUser.id}
                        className="card card-hover"
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: 'pointer' }}
                          onClick={() => {
                            if (onViewProfile) {
                              onViewProfile(targetUser.id);
                            } else {
                              handleStartChatWithTarget(targetUser);
                            }
                          }}
                        >
                          <Avatar
                            src={targetUser.avatar_url}
                            name={targetUser.display_name}
                            size="md"
                            isOnline={targetUser.show_online_status}
                          />

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {targetUser.display_name}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{targetUser.username}</span>
                              <span className="user-code-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                {targetUser.user_code}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!blocked && (
                          <OutlinedButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartChatWithTarget(targetUser)}
                            isLoading={isStarting}
                            icon={<MessageCircle size={14} />}
                          >
                            Chat
                          </OutlinedButton>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={28} style={{ margin: '0 auto 8px auto', color: 'var(--color-primary)' }} />
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    No users or chats found
                  </p>
                  <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                    Try searching with exact 8-character ID (e.g. HGP8QZ3J) or @username.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* STANDARD MODE: Normal Conversation List & Empty State Recommendations */
          <>
            {isLoadingConversations ? (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="skeleton" style={{ width: '50%', height: '14px' }} />
                      <div className="skeleton" style={{ width: '80%', height: '12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              /* If user has 0 chats, show Suggested Users immediately below search bar! */
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ textAlign: 'center', padding: '16px 8px 8px 8px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--color-primary-light)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      marginBottom: '10px',
                    }}
                  >
                    <MessageSquare size={26} />
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>
                    {t('no_chats_yet') || 'No Chats Yet'}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.4 }}>
                    Start chatting with friends below or search anyone by their unique ID.
                  </p>
                </div>

                {/* Suggested Users Section right on the chat page */}
                {suggestedUsers.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      <Sparkles size={14} color="var(--color-primary)" />
                      <span>Suggested People</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {suggestedUsers.map((targetUser) => {
                        const isStarting = startingChatUserId === targetUser.id;

                        return (
                          <div
                            key={targetUser.id}
                            className="card card-hover"
                            style={{
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: 'pointer' }}
                              onClick={() => handleStartChatWithTarget(targetUser)}
                            >
                              <Avatar
                                src={targetUser.avatar_url}
                                name={targetUser.display_name}
                                size="md"
                                isOnline={targetUser.show_online_status}
                              />

                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {targetUser.display_name}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{targetUser.username}</span>
                                  <span className="user-code-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                    {targetUser.user_code}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <OutlinedButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartChatWithTarget(targetUser)}
                              isLoading={isStarting}
                              icon={<MessageCircle size={14} />}
                            >
                              Chat
                            </OutlinedButton>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* List of active conversations */
              filteredConversations.map((conv) => {
                const isGroup = conv.is_group;
                const other = conv.other_member;
                const isSelected = activeConversation?.id === conv.id;
                const unread = conv.unread_count || 0;
                const displayTitle = isGroup ? (conv.title || 'Group Chat') : (other?.display_name || 'User');
                const memberCount = isGroup ? (conv.members?.length || 0) : 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`conversation-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {/* Avatar: Group or User */}
                    {isGroup ? (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: conv.avatar_url
                            ? `url(${conv.avatar_url}) center / cover no-repeat`
                            : 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                        }}
                      >
                        {!conv.avatar_url && <Users size={22} />}
                      </div>
                    ) : (
                      <Avatar
                        src={other?.avatar_url}
                        name={other?.display_name || 'User'}
                        size="lg"
                        isOnline={other?.show_online_status}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span
                            style={{
                              fontWeight: unread > 0 ? 700 : 600,
                              fontSize: '0.98rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {displayTitle}
                          </span>
                          {isGroup && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                flexShrink: 0,
                              }}
                            >
                              {memberCount} members
                            </span>
                          )}
                        </div>

                        {conv.last_message_at && (
                          <span style={{ fontSize: '0.75rem', color: unread > 0 ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0, fontWeight: unread > 0 ? 700 : 400 }}>
                            {formatRelativeTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: unread > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: unread > 0 ? 600 : 400,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '75%',
                          }}
                        >
                          {conv.last_message_text || (isGroup ? 'Group created' : 'Started a conversation')}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {unread > 0 && (
                            <span className="bottom-nav-badge" style={{ position: 'static' }}>
                              {unread}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvToManage(conv);
                              setShowConvOptionsModal(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Chat Options"
                            aria-label="Chat options"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--text-primary)';
                              e.currentTarget.style.background = 'var(--bg-card-hover)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Conversation Options Modal */}
      <Modal
        isOpen={showConvOptionsModal}
        onClose={() => setShowConvOptionsModal(false)}
        title={convToManage?.is_group ? (convToManage.title || 'Group Chat') : (convToManage?.other_member?.display_name || 'Chat Options')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              setShowConvOptionsModal(false);
              setShowClearConfirmModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card)')}
          >
            <Trash2 size={18} /> Clear Chat (Wipe messages from phone)
          </button>

          <button
            onClick={() => {
              setShowConvOptionsModal(false);
              setShowDeleteConfirmModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card)')}
          >
            <Trash2 size={18} /> Delete Conversation
          </button>

          <OutlinedButton
            variant="secondary"
            onClick={() => setShowConvOptionsModal(false)}
            style={{ marginTop: '8px' }}
          >
            Cancel
          </OutlinedButton>
        </div>
      </Modal>

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={showClearConfirmModal}
        onClose={() => setShowClearConfirmModal(false)}
        title="Clear Chat?"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Are you sure you want to clear this chat? All messages will be permanently removed from your phone immediately without waiting 30 days. Other participants will not be affected.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setShowClearConfirmModal(false)}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" isLoading={isProcessingConv} onClick={handleConfirmClearChat}>
            Clear Chat
          </OutlinedButton>
        </div>
      </Modal>

      {/* Delete Conversation Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Delete Conversation?"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Are you sure you want to remove this conversation from your chat list? All messages will be cleared from your phone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" isLoading={isProcessingConv} onClick={handleConfirmDeleteConv}>
            Delete
          </OutlinedButton>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(_convId) => {
          setIsCreateGroupOpen(false);
        }}
      />
    </div>
  );
};
