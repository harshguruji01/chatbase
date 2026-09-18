import React, { useState } from 'react';
import { Search, MessageSquare, Compass, UserPlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import type { TabType } from '../../types';

interface ConversationListProps {
  onSelectTab: (tab: TabType) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectTab }) => {
  const { conversations, activeConversation, selectConversation, isLoadingConversations } = useChat();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search & Quick Action Bar */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="input-wrapper">
          <Search size={16} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder="Search chats or messages..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px 10px 38px' }}
          />
        </div>

        {/* Quick Discovery Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => onSelectTab('nearby')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background var(--transition-fast)',
            }}
          >
            <Compass size={16} color="var(--color-primary)" />
            <span>Nearby People</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background var(--transition-fast)',
            }}
          >
            <UserPlus size={16} color="var(--color-pink)" />
            <span>Find by ID</span>
          </button>
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoadingConversations ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '46px', height: '46px', borderRadius: '50%' }} />
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
              No Conversations Yet
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '240px', lineHeight: 1.4 }}>
              Discover nearby users or search by unique User ID to start chatting!
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = conv.other_member;
            const isSelected = activeConversation?.id === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget.style.background = 'var(--bg-card-hover)');
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget.style.background = 'transparent');
                }}
              >
                <Avatar
                  src={other?.avatar_url}
                  name={other?.display_name || 'User'}
                  size="md"
                  isOnline={other?.show_online_status}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other?.display_name || 'ChatBase User'}
                    </span>
                    {conv.last_message_at && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message_text || 'Started a conversation'}
                    </p>

                    {(conv.unread_count || 0) > 0 && (
                      <span
                        style={{
                          background: 'var(--color-primary)',
                          color: '#FFFFFF',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          minWidth: '18px',
                          textAlign: 'center',
                          marginLeft: '6px',
                        }}
                      >
                        {conv.unread_count}
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
