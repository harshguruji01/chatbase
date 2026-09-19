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
  broadcastTyping: (isTyping: boolean) => void;
  selectConversation: (conversation: Conversation | null) => void;
  startChatWithUser: (targetUser: Profile) => Promise<{ conversationId?: string; error?: string }>;
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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);

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

      // Fetch other members for these conversations
      const { data: otherMembersData } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id, profiles:user_id(*)')
        .in('conversation_id', convIds)
        .neq('user_id', user.id);

      const otherMap = new Map<string, Profile>();
      if (otherMembersData) {
        otherMembersData.forEach((row: any) => {
          if (row.profiles) {
            otherMap.set(row.conversation_id, row.profiles as Profile);
          }
        });
      }

      const enriched: Conversation[] = convData.map((c) => ({
        ...c,
        other_member: otherMap.get(c.id),
        unread_count: unreadMap.get(c.id) || 0,
      }));

      setConversations(enriched);
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
    }
  }, [activeConversation, fetchMessages]);

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
          if (payload.is_typing) {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
              setIsOtherTyping(false);
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
            is_typing: isTyping,
          },
        });
      } catch (err) {
        console.warn('Failed to broadcast typing status:', err);
      }
    },
    [user, activeConversation]
  );

  const selectConversation = (conversation: Conversation | null) => {
    setActiveConversation(conversation);
    setIsOtherTyping(false);
  };

  // Find or create a conversation with a user
  const startChatWithUser = async (targetUser: Profile) => {
    if (!user) return { error: 'Not authenticated.' };
    if (user.id === targetUser.id) return { error: 'Cannot chat with yourself.' };

    // Check if blocked
    if (blockedUserIds.includes(targetUser.id)) {
      return { error: 'You have blocked this user. Unblock them first to chat.' };
    }

    try {
      // Check if conversation already exists between these 2 users
      const { data: myConvs } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvs && myConvs.length > 0) {
        const myConvIds = myConvs.map((c) => c.conversation_id);
        const { data: commonConvs } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', targetUser.id)
          .in('conversation_id', myConvIds);

        if (commonConvs && commonConvs.length > 0) {
          const existingId = commonConvs[0].conversation_id;
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', existingId)
            .single();

          if (existingConv) {
            const enrichedConv: Conversation = {
              ...existingConv,
              other_member: targetUser,
              unread_count: 0,
            };
            setActiveConversation(enrichedConv);
            await fetchConversations();
            return { conversationId: existingId };
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert({
          last_message_text: '',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newConvErr || !newConv) {
        return { error: newConvErr?.message || 'Could not start conversation.' };
      }

      // Add both members
      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: targetUser.id },
      ]);

      const enrichedConv: Conversation = {
        ...newConv,
        other_member: targetUser,
        unread_count: 0,
      };

      setActiveConversation(enrichedConv);
      await fetchConversations();
      return { conversationId: newConv.id };
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
    if (targetUserId && blockedUserIds.includes(targetUserId)) {
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
        broadcastTyping,
        selectConversation,
        startChatWithUser,
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
