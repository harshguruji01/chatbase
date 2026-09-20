import React, { useState, useRef } from 'react';
import { Camera, Edit3, Check, UserPlus, LogOut, Shield, X, Users, Search } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { supabase } from '../../lib/supabase';
import type { Conversation, Profile } from '../../types';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  onViewProfile?: (userId: string) => void;
  onLeaveSuccess?: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onViewProfile,
  onLeaveSuccess,
}) => {
  const { user } = useAuth();
  const { updateGroupInfo, addGroupMembers, leaveGroup } = useChat();
  const { showToast } = useToast();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title || '');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Add members sub-view
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<Profile[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Profile[]>([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // Leave confirm modal
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const members = conversation.members || [];
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin' || conversation.created_by === user?.id;

  const handleSaveTitle = async () => {
    if (!newTitle.trim()) return;
    setIsUpdatingTitle(true);
    try {
      const { error } = await updateGroupInfo(conversation.id, newTitle.trim(), null);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Group name updated', 'success');
        setIsEditingTitle(false);
      }
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5 MB', 'error');
      return;
    }

    setNewAvatarPreview(URL.createObjectURL(file));
    setIsUpdatingAvatar(true);
    try {
      const { error } = await updateGroupInfo(conversation.id, conversation.title || '', file);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Group icon updated', 'success');
      }
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  // Search candidate users to add
  const handleSearchUsersToAdd = async (q: string) => {
    setAddSearchQuery(q);
    const cleanQ = q.trim().replace(/^@/, '');
    if (!cleanQ) {
      setAddSearchResults([]);
      return;
    }

    setIsSearchingAdd(true);
    try {
      const existingUserIds = new Set(members.map((m) => m.user_id));
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`user_code.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`)
        .limit(15);

      if (data) {
        const filtered = (data as Profile[]).filter((p) => !existingUserIds.has(p.id));
        setAddSearchResults(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAdd(false);
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setIsAddingMembers(true);
    try {
      const ids = selectedToAdd.map((u) => u.id);
      const { error } = await addGroupMembers(conversation.id, ids);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast(`Added ${selectedToAdd.length} member(s)!`, 'success');
        setShowAddMembers(false);
        setSelectedToAdd([]);
        setAddSearchQuery('');
        setAddSearchResults([]);
      }
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    try {
      const { error } = await leaveGroup(conversation.id);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('You have left the group', 'info');
        setShowLeaveConfirm(false);
        onClose();
        if (onLeaveSuccess) onLeaveSuccess();
      }
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Group Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header with Group Icon and Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: newAvatarPreview || conversation.avatar_url
                    ? `url(${newAvatarPreview || conversation.avatar_url}) center / cover no-repeat`
                    : 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!newAvatarPreview && !conversation.avatar_url && (
                  <Users size={36} />
                )}

                {isUpdatingAvatar && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '22px', height: '22px' }} />
                  </div>
                )}
              </div>

              {/* Icon change button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: '2px solid var(--bg-card)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
                title="Change Group Icon"
              >
                <Camera size={14} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Group Name & Edit Title */}
            <div style={{ width: '100%', maxWidth: '320px' }}>
              {isEditingTitle ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                    maxLength={40}
                    style={{ fontSize: '1rem', padding: '6px 12px' }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={isUpdatingTitle || !newTitle.trim()}
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      setNewTitle(conversation.title || '');
                    }}
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {conversation.title || 'Group Chat'}
                  </h3>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                    title="Edit Name"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              )}

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                {members.length} member{members.length !== 1 ? 's' : ''}
                {isAdmin && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}> • Admin</span>}
              </p>
            </div>
          </div>

          {/* Members Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Group Members ({members.length})
            </span>

            <button
              onClick={() => setShowAddMembers(!showAddMembers)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <UserPlus size={15} />
              <span>{showAddMembers ? 'Close Add' : 'Add People'}</span>
            </button>
          </div>

          {/* Add People Expandable Section */}
          {showAddMembers && (
            <div
              className="card"
              style={{
                padding: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div className="input-wrapper">
                <Search size={15} className="input-icon-left" />
                <input
                  type="text"
                  className="input-field has-left-icon"
                  placeholder="Search user ID or username to add..."
                  value={addSearchQuery}
                  onChange={(e) => handleSearchUsersToAdd(e.target.value)}
                  style={{ borderRadius: 'var(--radius-full)', padding: '8px 14px 8px 34px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Selected to add chips */}
              {selectedToAdd.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedToAdd.map((u) => (
                    <span
                      key={u.id}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-light)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {u.display_name}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedToAdd((prev) => prev.filter((x) => x.id !== u.id))}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {isSearchingAdd ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                  Searching...
                </div>
              ) : addSearchResults.length > 0 ? (
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {addSearchResults.map((u) => {
                    const isPicked = selectedToAdd.some((x) => x.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedToAdd((prev) =>
                            isPicked ? prev.filter((x) => x.id !== u.id) : [...prev, u]
                          );
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: isPicked ? 'var(--color-primary-light)' : 'var(--bg-card)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{u.display_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username} • {u.user_code}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: isPicked ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {isPicked ? 'Selected' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : addSearchQuery.trim() ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
                  No new users found
                </div>
              ) : null}

              {selectedToAdd.length > 0 && (
                <OutlinedButton
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAddMembers}
                  isLoading={isAddingMembers}
                >
                  Add {selectedToAdd.length} Member{selectedToAdd.length > 1 ? 's' : ''} to Group
                </OutlinedButton>
              )}
            </div>
          )}

          {/* Members Scroll List */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {members.map((m) => {
              const p = m.profile;
              if (!p) return null;
              const isCreatorOrAdmin = m.role === 'admin' || conversation.created_by === p.id;
              const isSelf = p.id === user?.id;

              return (
                <div
                  key={m.id || p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    onClick={() => {
                      if (onViewProfile) onViewProfile(p.id);
                    }}
                  >
                    <Avatar src={p.avatar_url} name={p.display_name} size="md" isOnline={p.show_online_status} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {p.display_name}
                        </span>
                        {isSelf && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                            (You)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{p.username} • {p.user_code}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCreatorOrAdmin && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--color-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Shield size={10} /> Admin
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leave Group Action */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <OutlinedButton
              variant="danger"
              size="sm"
              onClick={() => setShowLeaveConfirm(true)}
              icon={<LogOut size={15} />}
            >
              Leave Group
            </OutlinedButton>

            <OutlinedButton variant="secondary" size="sm" onClick={onClose}>
              Done
            </OutlinedButton>
          </div>
        </div>
      </Modal>

      {/* Leave Group Confirmation Modal */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Leave Group?"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Are you sure you want to leave <strong>"{conversation.title}"</strong>? You will no longer receive messages or be able to participate in this group chat.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setShowLeaveConfirm(false)} disabled={isLeaving}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" onClick={handleConfirmLeave} isLoading={isLeaving}>
            Leave Group
          </OutlinedButton>
        </div>
      </Modal>
    </>
  );
};
