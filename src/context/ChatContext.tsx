import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Conversation, Message, MessageType, Profile } from '../types';
import { triggerHaptics } from '../lib/utils';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  uploadProgress: number | null;
  isOtherTyping: boolean;
  typingUserName?: string;
  broadcastTyping: (isTyping: boolean) => void;
  selectConversation: (conversation: Conversation | null) => void;
  startChatWithUser: (targetUser: Profile) => Promise<{ conversationId?: string; error?: string }>;
  createGroup: (title: string, avatarFile: File | null, memberIds: string[]) => Promise<{ conversationId?: string; error?: string }>;
  updateGroupInfo: (convId: string, title: string, avatarFile: File | null) => Promise<{ error?: string }>;
  addGroupMembers: (convId: string, memberIds: string[]) => Promise<{ error?: string }>;
  leaveGroup: (convId: string) => Promise<{ error?: string }>;
  sendMessage: (options: {
    type: MessageType;
    content?: string;
    mediaFile?: File | Blob;
    duration?: number;
  }) => Promise<{ error?: string }>;
  deleteMessage: (messageId: string, forEveryone: boolean) => Promise<{ error?: string }>;
  toggleReaction: (messageId: string, emoji: string) => Promise<{ error?: string }>;
  refreshConversations: () => Promise<void>;
  blockUser: (targetUserId: string, reason?: string) => Promise<{ error?: string }>;
  unblockUser: (targetUserId: string) => Promise<{ error?: string }>;
  isUserBlocked: (targetUserId: string) => boolean;
  blockedUserIds: string[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const [typingUserName, setTypingUserName] = useState<string>('');

  const activeChannelRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch list of blocked users
  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    if (data) {
      setBlockedUserIds(data.map((b) => b.blocked_id));
    }
  }, [user]);

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      // Get conversation memberships for user
      const { data: memberData, error: memberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, unread_count')
        .eq('user_id', user.id);

      if (memberErr || !memberData || memberData.length === 0) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      const convIds = memberData.map((m) => m.conversation_id);
      const unreadMap = new Map(memberData.map((m) => [m.conversation_id, m.unread_count]));

      // Fetch conversations info
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (convErr || !convData) {
        setIsLoadingConversations(false);
        return;
      }

      // Fetch all members for these conversations
      const { data: allMembersData } = await supabase
        .from('conversation_members')
        .select('id, conversation_id, user_id, unread_count, last_read_at, cleared_at, created_at, role, profiles:user_id(*)')
        .in('conversation_id', convIds);

      const convMembersMap = new Map<string, any[]>();
      if (allMembersData) {
        allMembersData.forEach((row: any) => {
          const list = convMembersMap.get(row.conversation_id) || [];
          list.push({
            ...row,
            profile: row.profiles as Profile,
          });
          convMembersMap.set(row.conversation_id, list);
        });
      }

      const enriched: Conversation[] = convData.map((c) => {
        const membersList = convMembersMap.get(c.id) || [];
        const otherMember = membersList.find((m) => m.user_id !== user.id)?.profile;

        return {
          ...c,
          is_group: Boolean(c.is_group),
          title: c.title || (c.is_group ? 'Group Chat' : otherMember?.display_name || 'Chat'),
          avatar_url: c.avatar_url || (c.is_group ? null : otherMember?.avatar_url),
          other_member: otherMember,
          members: membersList,
          unread_count: unreadMap.get(c.id) || 0,
        };
      });

      setConversations(enriched);

      // Also keep activeConversation updated if currently selected
      setActiveConversation((current) => {
        if (!current) return null;
        const fresh = enriched.find((c) => c.id === current.id);
        return fresh ? { ...current, ...fresh } : current;
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    if (!user) return;
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(*)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Filter out messages deleted for current user
        const visibleMessages = (data as Message[]).filter(
          (m) => !m.deleted_by_users?.includes(user.id)
        );
        setMessages(visibleMessages);

        // Mark unread as 0 in membership
        await supabase
          .from('conversation_members')
          .update({ unread_count: 0, last_read_at: new Date().toISOString() })
          .eq('conversation_id', convId)
          .eq('user_id', user.id);

        // Live Read Receipts: Mark incoming messages as read in database
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('conversation_id', convId)
          .neq('sender_id', user.id)
          .in('status', ['sent', 'delivered']);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchBlockedUsers();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setBlockedUserIds([]);
    }
  }, [user, fetchConversations, fetchBlockedUsers]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    } else {
      setMessages([]);
      setIsOtherTyping(false);
      setTypingUserName('');
    }
  }, [activeConversation?.id, fetchMessages]);

  // Real-time listener for incoming messages, updates, and typing broadcast
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chatbase-realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as Message;

          // If message is in active conversation, append it
          if (activeConversation && newMsg.conversation_id === activeConversation.id) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newMsg.sender_id)
              .single();

            const fullMsg: Message = {
              ...newMsg,
              sender: senderProfile as Profile,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === fullMsg.id)) return prev;
              return [...prev, fullMsg];
            });

            // Mark read if it's not sent by current user
            if (newMsg.sender_id !== user.id) {
              await supabase
                .from('messages')
                .update({ status: 'read' })
                .eq('id', newMsg.id);

              await supabase
                .from('conversation_members')
                .update({ unread_count: 0, last_read_at: new Date().toISOString() })
                .eq('conversation_id', activeConversation.id)
                .eq('user_id', user.id);
            }
          }

          // Refresh conversation list to show latest message preview and badge
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new as Message;
          if (activeConversation && updatedMsg.conversation_id === activeConversation.id) {
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (
          activeConversation &&
          payload &&
          payload.conversation_id === activeConversation.id &&
          payload.user_id !== user.id
        ) {
          setIsOtherTyping(Boolean(payload.is_typing));
          setTypingUserName(payload.user_name || '');
          if (payload.is_typing) {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
              setIsOtherTyping(false);
              setTypingUserName('');
            }, 3500);
          }
        }
      })
      .subscribe();

    activeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      activeChannelRef.current = null;
    };
  }, [user, activeConversation, fetchConversations]);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!user || !activeConversation || !activeChannelRef.current) return;
      try {
        activeChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            conversation_id: activeConversation.id,
            user_id: user.id,
            user_name: profile?.display_name || user.email?.split('@')[0] || 'Member',
            is_typing: isTyping,
          },
        });
      } catch (err) {
        console.warn('Failed to broadcast typing status:', err);
      }
    },
    [user, profile, activeConversation]
  );

  const selectConversation = (conversation: Conversation | null) => {
    setActiveConversation(conversation);
    setIsOtherTyping(false);
    setTypingUserName('');
  };

  // Find or create a direct conversation with a user atomically via Postgres RPC
  const startChatWithUser = async (targetUser: Profile): Promise<{ conversationId?: string; error?: string }> => {
    if (!user) return { error: 'Not authenticated.' };
    if (user.id === targetUser.id) return { error: 'Cannot chat with yourself.' };

    // Check if blocked
    if (blockedUserIds.includes(targetUser.id)) {
      return { error: 'You have blocked this user. Unblock them first to chat.' };
    }

    try {
      // 1. Call atomic database RPC function (bypasses RLS race condition)
      const { data: convId, error: rpcErr } = await supabase.rpc('get_or_create_direct_conversation', {
        target_user_id: targetUser.id,
      });

      if (rpcErr || !convId) {
        console.error('RPC direct chat error:', rpcErr);
        return { error: rpcErr?.message || 'Could not start conversation.' };
      }

      // 2. Fetch the conversation row
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      const enrichedConv: Conversation = {
        ...(convData || {
          id: convId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_group: false,
        }),
        is_group: false,
        other_member: targetUser,
        unread_count: 0,
      };

      setActiveConversation(enrichedConv);
      await fetchConversations();
      return { conversationId: convId };
    } catch (err: any) {
      console.error('startChatWithUser exception:', err);
      return { error: err.message || 'Failed to start conversation' };
    }
  };

  // Create an Instagram-style Group Chat
  const createGroup = async (
    title: string,
    avatarFile: File | null,
    memberIds: string[]
  ): Promise<{ conversationId?: string; error?: string }> => {
    if (!user) return { error: 'Not authenticated.' };
    const cleanTitle = title.trim();
    if (!cleanTitle) return { error: 'Group title is required.' };

    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const filePath = `group-avatars/${user.id}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { data: convId, error: rpcErr } = await supabase.rpc('create_group_conversation', {
        p_title: cleanTitle,
        p_avatar_url: avatarUrl,
        p_member_ids: memberIds,
      });

      if (rpcErr || !convId) {
        return { error: rpcErr?.message || 'Failed to create group.' };
      }

      // Fetch group conversation
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      // Fetch all member profiles
      const { data: membersData } = await supabase
        .from('conversation_members')
        .select('*, profiles:user_id(*)')
        .eq('conversation_id', convId);

      const membersList = (membersData || []).map((m: any) => ({
        ...m,
        profile: m.profiles as Profile,
      }));

      const enrichedConv: Conversation = {
        ...(convData || {
          id: convId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_group: true,
          title: cleanTitle,
          avatar_url: avatarUrl,
        }),
        is_group: true,
        title: cleanTitle,
        avatar_url: avatarUrl,
        members: membersList,
        unread_count: 0,
      };

      setActiveConversation(enrichedConv);
      await fetchConversations();
      return { conversationId: convId };
    } catch (err: any) {
      return { error: err.message || 'Failed to create group.' };
    }
  };

  // Update Group Info (Name or Icon)
  const updateGroupInfo = async (
    convId: string,
    title: string,
    avatarFile: File | null
  ): Promise<{ error?: string }> => {
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const filePath = `group-avatars/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.rpc('update_group_info', {
        p_conv_id: convId,
        p_title: title.trim(),
        p_avatar_url: avatarUrl,
      });

      if (error) return { error: error.message };

      if (activeConversation?.id === convId) {
        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                title: title.trim() || prev.title,
                avatar_url: avatarUrl || prev.avatar_url,
              }
            : null
        );
      }

      await fetchConversations();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Add members to group
  const addGroupMembers = async (
    convId: string,
    memberIds: string[]
  ): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.rpc('add_group_members', {
        p_conv_id: convId,
        p_new_member_ids: memberIds,
      });

      if (error) return { error: error.message };

      // Refresh members
      const { data: membersData } = await supabase
        .from('conversation_members')
        .select('*, profiles:user_id(*)')
        .eq('conversation_id', convId);

      const membersList = (membersData || []).map((m: any) => ({
        ...m,
        profile: m.profiles as Profile,
      }));

      if (activeConversation?.id === convId) {
        setActiveConversation((prev) => (prev ? { ...prev, members: membersList } : null));
      }

      await fetchConversations();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Leave group
  const leaveGroup = async (convId: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.rpc('leave_group', {
        p_conv_id: convId,
      });

      if (error) return { error: error.message };

      if (activeConversation?.id === convId) {
        setActiveConversation(null);
      }

      await fetchConversations();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Send message
  const sendMessage = async ({
    type,
    content = '',
    mediaFile,
    duration,
  }: {
    type: MessageType;
    content?: string;
    mediaFile?: File | Blob;
    duration?: number;
  }) => {
    if (!user || !activeConversation) return { error: 'No active conversation.' };

    const targetUserId = activeConversation.other_member?.id;
    if (!activeConversation.is_group && targetUserId && blockedUserIds.includes(targetUserId)) {
      return { error: 'You have blocked this user. Unblock them first to send messages.' };
    }

    try {
      let mediaUrl: string | undefined;
      let mediaSizeBytes: number | undefined;

      if (mediaFile) {
        mediaSizeBytes = mediaFile.size;
        // Server & Client limit check for video/image: 10 MB
        if ((type === 'video' || type === 'image') && mediaFile.size > 10 * 1024 * 1024) {
          return { error: `${type === 'image' ? 'Image' : 'Video'} file size must be less than 10 MB.` };
        }

        // Voice duration limit: 60s
        if (type === 'voice' && duration && duration > 60) {
          return { error: 'Voice message cannot exceed 60 seconds (1 minute).' };
        }

        setUploadProgress(10);
        let ext = 'webm';
        if (type === 'video') {
          ext = 'mp4';
        } else if (type === 'image') {
          if (mediaFile.type?.includes('png')) ext = 'png';
          else if (mediaFile.type?.includes('webp')) ext = 'webp';
          else if (mediaFile.type?.includes('gif')) ext = 'gif';
          else ext = 'jpg';
        } else if (type === 'voice') {
          if (mediaFile.type?.includes('mp4') || mediaFile.type?.includes('aac') || mediaFile.type?.includes('m4a')) {
            ext = 'm4a';
          } else if (mediaFile.type?.includes('ogg')) {
            ext = 'ogg';
          } else {
            ext = 'webm';
          }
        }

        const filePath = `${user.id}/${activeConversation.id}/${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('chat-media')
          .upload(filePath, mediaFile, {
            upsert: false,
          });

        if (uploadErr || !uploadData) {
          setUploadProgress(null);
          return { error: uploadErr?.message || 'Media upload failed.' };
        }

        setUploadProgress(90);
        const { data: publicUrlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);

        mediaUrl = publicUrlData.publicUrl;
        setUploadProgress(null);
      }

      // 30-day expiration calculation
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let summaryText = content;
      if (type === 'voice') summaryText = '🎤 Voice note';
      else if (type === 'video') summaryText = '📹 Video message';
      else if (type === 'image') summaryText = content.trim() ? `📷 ${content.trim()}` : '📷 Photo';
      else if (type === 'like') summaryText = '❤️';

      const { data: newMsg, error: insertErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          type,
          content: content.trim(),
          media_url: mediaUrl,
          media_duration: duration || null,
          media_size_bytes: mediaSizeBytes || null,
          status: 'sent',
          expires_at: expiresAt,
        })
        .select('*, sender:sender_id(*)')
        .single();

      if (insertErr) {
        return { error: insertErr.message };
      }

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message_text: summaryText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', activeConversation.id);

      // Increment other member's unread count
      if (targetUserId) {
        try {
          await supabase.rpc('increment_unread', {
            conv_id: activeConversation.id,
            target_user: targetUserId,
          });
        } catch {
          // ignore if rpc not present
        }
      }

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg as Message]);
        triggerHaptics(20);
      }

      return {};
    } catch (err: any) {
      setUploadProgress(null);
      return { error: err.message || 'Failed to send message.' };
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      if (forEveryone) {
        const { error } = await supabase
          .from('messages')
          .update({
            deleted_for_everyone: true,
            content: 'This message was deleted.',
            media_url: null,
          })
          .eq('id', messageId)
          .eq('sender_id', user.id);

        if (error) return { error: error.message };
      } else {
        // Delete for me
        const msg = messages.find((m) => m.id === messageId);
        const currentDeleted = msg?.deleted_by_users || [];
        const { error } = await supabase
          .from('messages')
          .update({
            deleted_by_users: [...currentDeleted, user.id],
          })
          .eq('id', messageId);

        if (error) return { error: error.message };

        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }

      triggerHaptics(15);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const blockUser = async (targetUserId: string, reason = '') => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: targetUserId,
        reason,
      });

      if (error) return { error: error.message };

      await fetchBlockedUsers();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const unblockUser = async (targetUserId: string) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);

      if (error) return { error: error.message };

      await fetchBlockedUsers();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return { error: 'Not authenticated' };
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return { error: 'Message not found' };

    const currentReactions: Record<string, string> = { ...(targetMsg.reactions || {}) };
    if (currentReactions[user.id] === emoji) {
      delete currentReactions[user.id];
    } else {
      currentReactions[user.id] = emoji;
    }

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: currentReactions } : m))
    );
    triggerHaptics(12);

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId);

      if (error) {
        // Revert on failure
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: targetMsg.reactions } : m))
        );
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const isUserBlocked = (targetUserId: string) => {
    return blockedUserIds.includes(targetUserId);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        uploadProgress,
        isOtherTyping,
        typingUserName,
        broadcastTyping,
        selectConversation,
        startChatWithUser,
        createGroup,
        updateGroupInfo,
        addGroupMembers,
        leaveGroup,
        sendMessage,
        deleteMessage,
        toggleReaction,
        refreshConversations: fetchConversations,
        blockUser,
        unblockUser,
        isUserBlocked,
        blockedUserIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
