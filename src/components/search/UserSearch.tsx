import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, UserPlus, UserCheck, MessageCircle, AlertCircle, Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useToast } from '../common/Toast';

interface UserSearchProps {
  onStartChat: () => void;
  onViewProfile: (userId: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onStartChat, onViewProfile }) => {
  const { user } = useAuth();
  const { startChatWithUser, isUserBlocked } = useChat();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Profile & { is_following?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(
    async (searchTerm: string) => {
      const q = searchTerm.trim();
      if (!q || !user) {
        setResults([]);
        setIsLoading(false);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      try {
        const isUserCode = q.toUpperCase().startsWith('HG');
        let dbQuery = supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(20);

        if (isUserCode) {
          dbQuery = dbQuery.ilike('user_code', `%${q.toUpperCase()}%`);
        } else {
          const cleanQ = q.replace(/^@/, '');
          dbQuery = dbQuery.or(`username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`);
        }

        const { data, error } = await dbQuery;

        if (error || !data) {
          setResults([]);
        } else {
          // Check follow status for each user
          const { data: myFollows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

          const followSet = new Set((myFollows || []).map((f) => f.following_id));

          const enriched = (data as Profile[]).map((p) => ({
            ...p,
            is_following: followSet.has(p.id),
          }));

          setResults(enriched);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleFollowToggle = async (targetUser: Profile & { is_following?: boolean }) => {
    if (!user) return;
    try {
      if (targetUser.is_following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUser.id);

        setResults((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: false } : u))
        );
        showToast(`Unfollowed @${targetUser.username}`, 'info');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUser.id,
          status: targetUser.is_private ? 'pending' : 'accepted',
        });

        setResults((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: true } : u))
        );
        showToast(targetUser.is_private ? 'Follow request sent!' : `Following @${targetUser.username}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleChat = async (targetUser: Profile) => {
    const { error } = await startChatWithUser(targetUser);
    if (error) {
      showToast(error, 'error');
    } else {
      onStartChat();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Prominent Search Header */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Find People</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Search by Unique User ID (e.g. HG8X29K4) or @username
            </p>
          </div>
        </div>

        <div className="input-wrapper">
          <Search size={18} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder="Search e.g. HG8X29K4 or @harsh..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)', padding: '12px 42px 12px 44px', fontSize: '0.95rem' }}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="input-icon-right"
              style={{ padding: '4px' }}
              aria-label="Clear Search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card skeleton" style={{ height: '76px' }} />
            ))}
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={36} color="var(--color-primary)" />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600 }}>
              No Users Found
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>
              Check for typos or try searching with the exact 8-character User ID (e.g. HG8X29K4).
            </p>
          </div>
        ) : results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((u) => {
              const blocked = isUserBlocked(u.id);

              return (
                <div
                  key={u.id}
                  className="card card-hover"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    onClick={() => onViewProfile(u.id)}
                  >
                    <Avatar
                      src={u.avatar_url}
                      name={u.display_name}
                      size="md"
                      isOnline={u.show_online_status}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {u.display_name}
                        </span>
                        {blocked && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Ban size={10} /> Blocked
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span>
                        <span className="user-code-badge" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                          {u.user_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {!blocked && (
                      <>
                        <OutlinedButton
                          variant={u.is_following ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleFollowToggle(u)}
                          icon={u.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        >
                          {u.is_following ? 'Following' : 'Follow'}
                        </OutlinedButton>

                        <OutlinedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleChat(u)}
                          icon={<MessageCircle size={14} />}
                        >
                          Chat
                        </OutlinedButton>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Search size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Type to Search ChatBase
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>
              Enter any friend's username or unique 8-character ID to instantly discover and connect with them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
