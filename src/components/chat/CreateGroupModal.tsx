import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, X, Check, Users, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (conversationId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { user } = useAuth();
  const { createGroup } = useChat();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load followers/following list as initial candidates when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;

    const loadInitialCandidates = async () => {
      try {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following:following_id(*), follower:follower_id(*)')
          .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
          .limit(25);

        const candidatesMap = new Map<string, Profile>();
        (followsData || []).forEach((row: any) => {
          if (row.following && row.following.id !== user.id) {
            candidatesMap.set(row.following.id, row.following as Profile);
          }
          if (row.follower && row.follower.id !== user.id) {
            candidatesMap.set(row.follower.id, row.follower as Profile);
          }
        });

        setSearchResults(Array.from(candidatesMap.values()));
      } catch (err) {
        console.warn('Could not load candidates:', err);
      }
    };

    loadInitialCandidates();
  }, [isOpen, user]);

  // Search users by query
  useEffect(() => {
    if (!isOpen || !user) return;
    const q = searchQuery.trim().replace(/^@/, '');
    if (!q) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .or(`user_code.ilike.%${q}%,username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(20);

        if (data) {
          setSearchResults(data as Profile[]);
        }
      } catch (err) {
        console.error('Search in group modal error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5 MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleUserSelection = (targetUser: Profile) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === targetUser.id);
      if (exists) {
        return prev.filter((u) => u.id !== targetUser.id);
      } else {
        return [...prev, targetUser];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a group name', 'info');
      return;
    }
    if (selectedUsers.length === 0) {
      showToast('Please select at least 1 member for the group', 'info');
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = selectedUsers.map((u) => u.id);
      const { conversationId, error } = await createGroup(title.trim(), avatarFile, memberIds);

      if (error) {
        showToast(error, 'error');
      } else {
        showToast(`Group "${title.trim()}" created! 🎉`, 'success');
        onClose();
        // Reset state
        setTitle('');
        setAvatarFile(null);
        setAvatarPreview(null);
        setSelectedUsers([]);
        setSearchQuery('');
        if (conversationId && onGroupCreated) {
          onGroupCreated(conversationId);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create group', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group Chat">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top: Group Icon & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 0' }}>
          {/* Avatar Upload Box */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: avatarPreview
                  ? `url(${avatarPreview}) center / cover no-repeat`
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))',
                border: '2px dashed var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease',
              }}
              title="Click to choose group icon"
            >
              {!avatarPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--color-primary)' }}>
                  <Camera size={22} />
                  <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>ICON</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            {avatarPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-danger)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Group Name Field */}
          <div style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '4px' }}>Group Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Friends & Family, Trip 2026..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              autoFocus
              style={{ borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>

        {/* Selected Members Chips */}
        {selectedUsers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear all
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '88px',
                overflowY: 'auto',
                padding: '4px 0',
              }}
            >
              {selectedUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px 4px 6px',
                    background: 'var(--color-primary-light)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                  <span style={{ fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.display_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSelectedUser(u.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Search Bar */}
        <div className="input-wrapper">
          <Search size={16} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder="Search by ID, username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px 10px 38px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="input-icon-right"
              style={{ padding: '4px' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Candidate Members Checklist */}
        <div
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
          }}
        >
          {isSearching ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Searching users...
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={24} color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem' }}>No users found</span>
            </div>
          ) : (
            searchResults.map((targetUser) => {
              const isSelected = selectedUsers.some((u) => u.id === targetUser.id);
              return (
                <div
                  key={targetUser.id}
                  onClick={() => toggleUserSelection(targetUser)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Avatar src={targetUser.avatar_url} name={targetUser.display_name} size="md" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {targetUser.display_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>@{targetUser.username}</span>
                        <span className="user-code-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          {targetUser.user_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--border-color)',
                      background: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <OutlinedButton variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </OutlinedButton>
          <OutlinedButton
            variant="primary"
            onClick={handleCreate}
            isLoading={isCreating}
            icon={<Users size={16} />}
            disabled={!title.trim() || selectedUsers.length === 0}
          >
            Create Group
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
