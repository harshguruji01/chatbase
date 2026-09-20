import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  Calendar,
  Copy,
  Check,
  Lock,
  Globe,
  Radio,
  Ban,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { copyToClipboard, formatRelativeTime, formatMemberSince } from '../../lib/utils';
import { useBackButton } from '../../lib/useBackButton';

interface PublicProfileModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onStartChat?: (targetUser: Profile) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  userId,
  onClose,
  onStartChat,
}) => {
  const { user } = useAuth();
  const { blockUser, unblockUser, isUserBlocked, startChatWithUser } = useChat();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useBackButton(() => {
    onClose();
    return true;
  }, isOpen, 70);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch user profile
        const { data: userData, error: userErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (userErr || !userData) {
          showToast('Could not load user profile', 'error');
          onClose();
          return;
        }

        if (!isMounted) return;
        setProfile(userData as Profile);

        // 2. Fetch follower & following counts
        const [followersRes, followingRes, followCheckRes] = await Promise.all([
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId),
          user
            ? supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (!isMounted) return;
        setFollowersCount(followersRes.count || 0);
        setFollowingCount(followingRes.count || 0);
        setIsFollowing(Boolean(followCheckRes.data));
      } catch (err: any) {
        console.error('Error fetching public profile:', err);
        showToast(err.message || 'Error loading profile', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, user, showToast, onClose]);

  const handleCopyCode = async () => {
    if (profile?.user_code) {
      await copyToClipboard(profile.user_code);
      setCopiedId(true);
      showToast(`Copied User ID: ${profile.user_code}`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profile || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        showToast(`Unfollowed @${profile.username}`, 'info');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profile.id,
          status: profile.is_private ? 'pending' : 'accepted',
        });

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        showToast(
          profile.is_private ? 'Follow request sent!' : `Now following @${profile.username}`,
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update follow status', 'error');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!profile) return;
    setIsStartingChat(true);
    try {
      if (onStartChat) {
        onStartChat(profile);
      } else {
        const { error } = await startChatWithUser(profile);
        if (error) {
          showToast(error, 'error');
          return;
        }
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to start chat', 'error');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!profile) return;
    const blocked = isUserBlocked(profile.id);
    if (blocked) {
      const { error } = await unblockUser(profile.id);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast(`Unblocked @${profile.username}`, 'success');
      }
    } else {
      if (window.confirm(`Are you sure you want to block @${profile.username}? They won't be able to message you.`)) {
        const { error } = await blockUser(profile.id, 'Blocked via public profile');
        if (error) {
          showToast(error, 'error');
        } else {
          showToast(`Blocked @${profile.username}`, 'success');
        }
      }
    }
  };

  if (!isOpen) return null;

  const isBlocked = profile ? isUserBlocked(profile.id) : false;
  const isMe = user?.id === profile?.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      {isLoading || !profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-primary-light)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading user details...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>
          {/* Header Card: Avatar, Name, Username & User ID */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              padding: '12px 8px 4px',
            }}
          >
            {/* Avatar with Ring */}
            <div
              style={{
                position: 'relative',
                padding: '3px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6366F1 100%)',
                marginBottom: '12px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name}
                size="xl"
                isOnline={profile.show_online_status}
              />
            </div>

            {/* Display Name */}
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {profile.display_name}
            </h3>

            {/* Username */}
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              @{profile.username}
            </p>

            {/* Badges: User ID + Member Since */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {/* Clickable Unique User Code */}
              <button
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
                title="Click to copy ID"
              >
                <span>ID: {profile.user_code}</span>
                {copiedId ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} color="var(--color-primary)" />}
              </button>

              {/* Member Since Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <Calendar size={13} />
                Joined {formatMemberSince(profile.created_at)}
              </span>

              {/* Online / Active status */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: profile.show_online_status ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                  color: profile.show_online_status ? '#10B981' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Radio size={12} />
                {profile.show_online_status ? 'Active now' : `Last seen ${formatRelativeTime(profile.last_seen || profile.updated_at)}`}
              </span>
            </div>
          </div>

          {/* Social Stats Counters (Followers, Following, Privacy) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--bg-input)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {followersCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                Followers
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {followingCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                Following
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: profile.is_private ? '#F59E0B' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {profile.is_private ? <Lock size={15} /> : <Globe size={15} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                {profile.is_private ? 'Private' : 'Public'}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                BIO
              </span>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
            </div>
          )}

          {/* Main Action Buttons */}
          {!isMe && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Message / Chat Button */}
                <button
                  onClick={handleStartChat}
                  disabled={isStartingChat || isBlocked}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{isStartingChat ? 'Opening chat...' : 'Message'}</span>
                </button>

                {/* Follow / Following Button */}
                <button
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: isFollowing ? 'var(--bg-input)' : 'var(--color-primary-light)',
                    color: isFollowing ? 'var(--text-primary)' : 'var(--color-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={18} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Block / Unblock User Action */}
              <button
                onClick={handleToggleBlock}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: isBlocked ? 'var(--color-success)' : 'var(--color-danger)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '8px',
                  cursor: 'pointer',
                  opacity: 0.85,
                }}
              >
                <Ban size={15} />
                <span>{isBlocked ? `Unblock @${profile.username}` : `Block @${profile.username}`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
