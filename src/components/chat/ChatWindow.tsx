import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MoreVertical, ShieldAlert, Ban, User, MessageCircle } from 'lucide-react';
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

interface ChatWindowProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack, onViewProfile }) => {
  const { user } = useAuth();
  const { activeConversation, messages, deleteMessage, blockUser, isUserBlocked } = useChat();
  const { showToast } = useToast();

  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = activeConversation?.other_member;
  const isBlocked = otherUser ? isUserBlocked(otherUser.id) : false;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!activeConversation || !otherUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <MessageCircle size={40} color="var(--color-primary)" />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Select a Conversation
        </h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.5 }}>
          Pick a conversation from the left or discover people nearby to start exchanging messages, voice notes, and videos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Chat Header */}
      <div
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
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

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => onViewProfile && onViewProfile(otherUser.id)}
          >
            <Avatar
              src={otherUser.avatar_url}
              name={otherUser.display_name}
              size="md"
              isOnline={otherUser.show_online_status}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  {otherUser.display_name}
                </span>
                <span className="user-code-badge" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                  {otherUser.user_code}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: otherUser.show_online_status ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {otherUser.show_online_status ? 'Online' : `Last active ${formatRelativeTime(otherUser.last_seen)}`}
              </span>
            </div>
          </div>
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

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        title={`Block @${otherUser.username}?`}
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
    </div>
  );
};
