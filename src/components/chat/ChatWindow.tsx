import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MoreVertical, ShieldAlert, Ban, User, Users, LogOut, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { OutlinedButton } from '../common/OutlinedButton';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { formatRelativeTime } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useBackButton } from '../../lib/useBackButton';
import { GroupDetailsModal } from './GroupDetailsModal';
import brandLogo from '../../assets/chatbase.png';

interface ChatWindowProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack, onViewProfile }) => {
  const { user } = useAuth();
  const { activeConversation, messages, deleteMessage, clearChat, blockUser, isUserBlocked, isOtherTyping, typingUserName } = useChat();
  const { showToast } = useToast();

  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const isGroup = Boolean(activeConversation?.is_group);
  const otherUser = activeConversation?.other_member;
  const isBlocked = !isGroup && otherUser ? isUserBlocked(otherUser.id) : false;
  const groupMembersCount = activeConversation?.members?.length || 0;

  // Hardware/Browser Back Handlers:
  // 1. Close menu if open (priority 50)
  useBackButton(() => setShowMenu(false), showMenu, 50);
  useBackButton(() => setShowGroupDetailsModal(false), showGroupDetailsModal, 60);
  useBackButton(() => setShowClearChatConfirm(false), showClearChatConfirm, 65);
  // 2. Go back from active chat to conversation list (priority 20)
  useBackButton(() => {
    if (onBack) {
      onBack();
      return true;
    }
  }, Boolean(onBack), 20);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConfirmClearChat = async () => {
    if (!activeConversation) return;
    setIsClearingChat(true);
    try {
      const { error } = await clearChat(activeConversation.id);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Chat cleared from your device', 'success');
        setShowClearChatConfirm(false);
        setShowMenu(false);
      }
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!otherUser) return;
    const { error } = await blockUser(otherUser.id, 'User blocked via chat menu');
    if (error) {
      showToast(error, 'error');
    } else {
      showToast(`Blocked @${otherUser.username}`, 'success');
      setShowBlockConfirm(false);
      setShowMenu(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otherUser) return;
    setIsReporting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: otherUser.id,
        reason: reportReason,
        details: reportDetails.trim(),
      });

      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Report submitted for moderation. Thank you!', 'success');
        setShowReportModal(false);
        setReportDetails('');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  if (!activeConversation || (!isGroup && !otherUser)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(236,72,153,0.3))',
              filter: 'blur(16px)',
              zIndex: 0,
            }}
          />
          <img
            src={brandLogo || './chatbase.png'}
            alt="ChatBase Logo"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              zIndex: 1,
              objectFit: 'contain',
            }}
          />
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            fontFamily: 'var(--font-brand)',
          }}
        >
          ChatBase for Web
        </h2>

        <p style={{ fontSize: '0.94rem', maxWidth: '420px', lineHeight: 1.6, marginBottom: '24px' }}>
          Left panel se koi bhi chat select karein ya <strong>"Discover Nearby"</strong> aur <strong>"Find by ID"</strong> se naye friends ke saath messaging shuru karein.
        </p>

        {/* Feature Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '480px' }}>
          <div style={{ padding: '8px 14px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🆔</span>
            <span>Unique ID Instant Search</span>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span>
            <span>Web & Mobile Realtime Sync</span>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎙️</span>
            <span>48kbps Studio Voice Notes</span>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🕒</span>
            <span>30-Day Auto Cleanup</span>
          </div>
        </div>

        <div style={{ marginTop: '36px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Made by <strong>HarshGuruJi</strong> • <a href="https://www.webguruji.online" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>www.webguruji.online</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Chat Header */}
      <div
        style={{
          height: 'calc(var(--header-height) + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {isGroup ? (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              onClick={() => setShowGroupDetailsModal(true)}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: activeConversation.avatar_url
                    ? `url(${activeConversation.avatar_url}) center / cover no-repeat`
                    : 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                }}
              >
                {!activeConversation.avatar_url && <Users size={20} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeConversation.title || 'Group Chat'}
                  </span>
                  <span className="user-code-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                    Group
                  </span>
                </div>
                {isOtherTyping ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {typingUserName ? `${typingUserName} is typing...` : 'typing...'}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {groupMembersCount} members • Tap for details
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              onClick={() => onViewProfile && otherUser && onViewProfile(otherUser.id)}
            >
              <Avatar
                src={otherUser?.avatar_url}
                name={otherUser?.display_name || 'User'}
                size="md"
                isOnline={otherUser?.show_online_status}
              />

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    {otherUser?.display_name}
                  </span>
                  <span className="user-code-badge" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                    {otherUser?.user_code}
                  </span>
                </div>
                {isOtherTyping ? (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    typing...
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: otherUser?.show_online_status ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {otherUser?.show_online_status ? 'Online' : `Last active ${formatRelativeTime(otherUser?.last_seen || '')}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Header Actions Menu */}
        <div style={{ position: 'relative' }}>
          <OutlinedButton
            variant="ghost"
            size="sm"
            className="btn-icon"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={18} />
          </OutlinedButton>

          {showMenu && (
            <div
              className="card fade-in-up"
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                padding: '6px',
                zIndex: 50,
                boxShadow: 'var(--shadow-lg)',
                minWidth: '170px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {isGroup ? (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowGroupDetailsModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <Users size={15} /> Group Details
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowClearChatConfirm(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <Trash2 size={15} /> Clear Chat
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowGroupDetailsModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <LogOut size={15} /> Leave Group
                  </button>
                </>
              ) : otherUser ? (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onViewProfile) onViewProfile(otherUser.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <User size={15} /> View Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowClearChatConfirm(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <Trash2 size={15} /> Clear Chat
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <ShieldAlert size={15} color="var(--color-warning)" /> Report User
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowBlockConfirm(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    <Ban size={15} /> Block User
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Top 30-day banner */}
        <div
          style={{
            alignSelf: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            marginBottom: '16px',
          }}
        >
          🔒 Messages automatically expire and clean up after 30 days
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOutgoing={msg.sender_id === user?.id}
            isGroup={isGroup}
            onDeleteMessage={deleteMessage}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer or Block Banner */}
      {isBlocked ? (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
          }}
        >
          🚫 You have blocked this user. Unblock them to continue chatting.
        </div>
      ) : (
        <Composer />
      )}

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={showClearChatConfirm}
        onClose={() => setShowClearChatConfirm(false)}
        title="Clear Chat?"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Are you sure you want to clear this chat? All messages in this conversation will be permanently removed from your phone immediately without waiting 30 days.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setShowClearChatConfirm(false)}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" isLoading={isClearingChat} onClick={handleConfirmClearChat}>
            Clear Chat
          </OutlinedButton>
        </div>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        title={`Block @${otherUser?.username || 'User'}?`}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Blocked users will no longer be able to message you, find you in nearby discovery, or follow you. Are you sure you want to block this user?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setShowBlockConfirm(false)}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" onClick={handleConfirmBlock}>
            Confirm Block
          </OutlinedButton>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report User for Abuse"
      >
        <form onSubmit={handleSendReport}>
          <div className="input-group">
            <label className="input-label">Reason</label>
            <select
              className="input-field"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="spam">Spam / Scam</option>
              <option value="harassment">Harassment / Bullying</option>
              <option value="inappropriate_content">Inappropriate Media</option>
              <option value="impersonation">Impersonation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Details (Optional)</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe what happened..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <OutlinedButton variant="secondary" type="button" onClick={() => setShowReportModal(false)}>
              Cancel
            </OutlinedButton>
            <OutlinedButton variant="danger" type="submit" isLoading={isReporting}>
              Submit Report
            </OutlinedButton>
          </div>
        </form>
      </Modal>

      {/* Group Details Modal */}
      {isGroup && (
        <GroupDetailsModal
          isOpen={showGroupDetailsModal}
          onClose={() => setShowGroupDetailsModal(false)}
          conversation={activeConversation}
          onViewProfile={onViewProfile}
          onLeaveSuccess={onBack}
        />
      )}
    </div>
  );
};
