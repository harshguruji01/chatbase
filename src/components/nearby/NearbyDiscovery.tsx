import React, { useState, useEffect } from 'react';
import { Compass, MapPin, RefreshCw, UserCheck, UserPlus, MessageCircle, AlertCircle, Lock, Sparkles, Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { AppDownloadModal } from '../common/AppDownloadModal';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { getCurrentPosition } from '../../lib/location';
import { supabase } from '../../lib/supabase';
import type { NearbyUser } from '../../types';
import { useToast } from '../common/Toast';

interface NearbyDiscoveryProps {
  onStartChat: () => void;
  onViewProfile: (userId: string) => void;
}

export const NearbyDiscovery: React.FC<NearbyDiscoveryProps> = ({
  onStartChat,
  onViewProfile,
}) => {
  const { user, profile, updateLocation } = useAuth();
  const { startChatWithUser } = useChat();
  const { showToast } = useToast();

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const fetchNearby = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch user's latest coordinates
      let lat = profile?.latitude;
      let lon = profile?.longitude;

      if (!lat || !lon) {
        try {
          const pos = await getCurrentPosition();
          lat = pos.latitude;
          lon = pos.longitude;
          await updateLocation(lat, lon);
          setLocationEnabled(true);
        } catch {
          setLocationEnabled(false);
          setIsLoading(false);
          return;
        }
      } else {
        setLocationEnabled(true);
      }

      // Call privacy-preserving RPC function
      const { data, error } = await supabase.rpc('get_nearby_users', {
        p_lat: lat,
        p_lon: lon,
        p_max_distance_km: 100.0,
      });

      if (error) {
        console.warn('RPC nearby users error:', error.message);
        setNearbyUsers([]);
      } else if (data) {
        setNearbyUsers(data as NearbyUser[]);
      }
    } catch (err: any) {
      console.error('Nearby fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    fetchNearby();
  }, [profile?.latitude, profile?.longitude]);

  const handleFollowToggle = async (targetUser: NearbyUser) => {
    if (!user) return;
    try {
      if (targetUser.is_following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUser.id);

        setNearbyUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: false } : u))
        );
        showToast(`Unfollowed @${targetUser.username}`, 'info');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUser.id,
          status: targetUser.is_private ? 'pending' : 'accepted',
        });

        setNearbyUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: true } : u))
        );
        showToast(targetUser.is_private ? 'Follow request sent!' : `Following @${targetUser.username}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleChat = async (targetUser: NearbyUser) => {
    setStartingChatUserId(targetUser.id);
    try {
      const { error } = await startChatWithUser(targetUser as any);
      if (error) {
        showToast(error, 'error');
      } else {
        onStartChat();
      }
    } finally {
      setStartingChatUserId(null);
    }
  };

  if (!Capacitor.isNativePlatform()) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', overflowY: 'auto', padding: '24px 16px', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="card"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Radar Pulse Rings */}
          <div
            style={{
              position: 'relative',
              width: '90px',
              height: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px 0',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px dashed var(--color-primary)',
                opacity: 0.4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Compass size={34} />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.5)',
              }}
            >
              <Lock size={14} />
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <Sparkles size={13} />
            Exclusive to Android App
          </div>

          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Live Nearby Radar Scanner
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              Live GPS proximity calculations, background device radar pings, and real-time distance sorting require native Android hardware sensors.
            </p>
          </div>

          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left', margin: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>Real-time GPS proximity within 100km radius</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <AlertCircle size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
              <span>Automatic proximity alert when friends are near</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <Sparkles size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <span>Battery-saving continuous background discovery</span>
            </div>
          </div>

          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Download size={20} />
            <span>Download Android App to Unlock</span>
          </button>
        </div>

        <AppDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          feature="radar"
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nearby Discovery</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Privacy-protected approximate distance
            </span>
          </div>
        </div>

        <OutlinedButton
          variant="secondary"
          size="sm"
          onClick={fetchNearby}
          isLoading={isLoading}
          icon={<RefreshCw size={14} />}
        >
          Refresh
        </OutlinedButton>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!locationEnabled ? (
          <div
            className="card"
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              maxWidth: '420px',
              margin: '30px auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger)',
              }}
            >
              <MapPin size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Location Access Required</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Enable location access to discover users around you. We only calculate approximate distances and never reveal your exact GPS coordinates or address.
            </p>
            <OutlinedButton variant="primary" size="md" onClick={fetchNearby} isLoading={isLoading}>
              Enable Location & Find People
            </OutlinedButton>
          </div>
        ) : isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card skeleton" style={{ height: '140px' }} />
            ))}
          </div>
        ) : nearbyUsers.length === 0 ? (
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
              No Users Nearby Currently
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>
              As other people in your area join ChatBase and enable location, they will appear here!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {nearbyUsers.map((u) => (
              <div key={u.id} className="card card-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    src={u.avatar_url}
                    name={u.display_name}
                    size="lg"
                    onClick={() => onViewProfile(u.id)}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        onClick={() => onViewProfile(u.id)}
                      >
                        {u.display_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span>
                      <span className="user-code-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        {u.user_code}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600 }}>
                      <MapPin size={12} />
                      <span>~{u.approx_distance_km} km away</span>
                    </div>
                  </div>
                </div>

                {u.bio && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {u.bio}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <OutlinedButton
                    variant={u.is_following ? 'secondary' : 'primary'}
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => handleFollowToggle(u)}
                    icon={u.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  >
                    {u.is_following ? 'Following' : 'Follow'}
                  </OutlinedButton>

                  <OutlinedButton
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => handleChat(u)}
                    isLoading={startingChatUserId === u.id}
                    icon={<MessageCircle size={14} />}
                  >
                    Chat
                  </OutlinedButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
