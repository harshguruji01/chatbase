export interface Profile {
  id: string;
  user_code: string; // e.g. 'HG8X29K4'
  username: string;
  display_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_private: boolean;
  appear_in_nearby: boolean;
  show_online_status: boolean;
  last_seen: string;
  latitude?: number | null;
  longitude?: number | null;
  location_updated_at?: string | null;
  is_suspended: boolean;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface NearbyUser {
  id: string;
  user_code: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_private: boolean;
  approx_distance_km: number;
  is_following: boolean;
  is_blocked: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  profile?: Profile;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string | null;
  created_at: string;
  blocked_profile?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_text?: string;
  last_message_at?: string;
  is_group?: boolean;
  title?: string;
  avatar_url?: string | null;
  created_by?: string | null;
  // enriched with other member details (for 1-on-1) or member list (for group)
  other_member?: Profile;
  members?: (ConversationMember & { profile?: Profile })[];
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  unread_count: number;
  last_read_at: string;
  cleared_at?: string | null;
  created_at: string;
  role?: 'admin' | 'member';
  profile?: Profile;
}

export type MessageType = 'text' | 'emoji' | 'voice' | 'video' | 'image' | 'like';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  media_url?: string | null;
  media_duration?: number | null; // seconds for voice
  media_size_bytes?: number | null; // bytes for video/image
  status: MessageStatus;
  deleted_for_everyone: boolean;
  deleted_by_users: string[];
  reactions?: Record<string, string> | null; // e.g. { [userId]: '❤️' }
  created_at: string;
  expires_at: string;
  // sender profile joined
  sender?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  reported?: Profile;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string;
  created_at: string;
  admin?: Profile;
}

export type TabType = 'home' | 'chat' | 'search' | 'profile';
