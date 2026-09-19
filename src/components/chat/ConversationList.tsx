import React, { useState } from 'react';
import { Search, MessageSquare, UserPlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { Avatar } from '../common/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import type { TabType } from '../../types';
import { BrandHeader } from '../common/BrandHeader';

interface ConversationListProps {
  onSelectTab: (tab: TabType) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectTab }) => {
  const { conversations, activeConversation, selectConversation, isLoadingConversations } = useChat();
  const { t } = useLanguage();
  const [searchFilter, setSearchFilter] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const other = c.other_member;
    return (
      other?.display_name?.toLowerCase().includes(q) ||
      other?.username?.toLowerCase().includes(q) ||
      other?.user_code?.toLowerCase().includes(q) ||
      c.last_message_text?.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--bg-app)' }}>
      {/* Top Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandHeader size="sm" showSubtitle={false} />
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

        {/* Search input */}
        <div className="input-wrapper">
          <Search size={16} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder={t('search_placeholder')}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px 10px 38px' }}
          />
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '70%',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <MessageSquare size={28} />
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
              {t('no_chats_yet')}
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '260px', lineHeight: 1.4, marginBottom: '16px' }}>
              {t('start_chat_desc')}
            </p>
            <button
              onClick={() => onSelectTab('search')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={16} />
              <span>{t('find_people')}</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = conv.other_member;
            const isSelected = activeConversation?.id === conv.id;
            const unread = conv.unread_count || 0;

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
                <Avatar
                  src={other?.avatar_url}
                  name={other?.display_name || 'User'}
                  size="lg"
                  isOnline={other?.show_online_status}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
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
                      {other?.display_name}
                    </span>

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
                        maxWidth: '85%',
                      }}
                    >
                      {conv.last_message_text || 'Started a conversation'}
                    </p>

                    {unread > 0 && (
                      <span className="bottom-nav-badge" style={{ position: 'static' }}>
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
