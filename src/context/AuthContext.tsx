import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    username: string;
    displayName: string;
    email: string;
    phone?: string;
    password: string;
    avatarFile?: File | null;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  updateLocation: (lat: number, lon: number) => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch warning:', error.message);
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      let emailToUse = identifier.trim();

      // If user typed username, unique user code (ID), or phone, resolve email via secure RPC
      if (!emailToUse.includes('@')) {
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'get_email_by_identifier',
          { identifier: emailToUse }
        );

        if (!rpcError && resolvedEmail) {
          emailToUse = resolvedEmail;
        } else {
          // Fallback check
          const query = supabase.from('profiles').select('email');
          if (emailToUse.toUpperCase().startsWith('HG')) {
            query.eq('user_code', emailToUse.toUpperCase());
          } else {
            query.ilike('username', emailToUse);
          }
          const { data: fallbackData } = await query.maybeSingle();
          if (fallbackData?.email) {
            emailToUse = fallbackData.email;
          } else {
            return { error: 'Account not found. Please check your ChatBase ID or Username.' };
          }
        }
      } else {
        emailToUse = emailToUse.toLowerCase();
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse.toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Galat Password ya Login ID. Kripya apna sahi password dalein.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Account verify nahi hua tha. Kripya ek baar aur login button dabayein.' };
        }
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in.' };
    }
  };

  const signUp = async ({
    username,
    displayName,
    email,
    phone,
    password,
    avatarFile,
  }: {
    username: string;
    displayName: string;
    email: string;
    phone?: string;
    password: string;
    avatarFile?: File | null;
  }) => {
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return { error: 'Username must be at least 3 alphanumeric characters.' };
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        return { error: 'This username is already taken. Please pick another.' };
      }

      let avatarUrl: string | undefined;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      // Call register_user RPC: eliminates email confirmation rate limits and instantly creates/confirms account
      const { data: regResult, error: regError } = await supabase.rpc('register_user', {
        p_email: email.trim(),
        p_password: password,
        p_username: cleanUsername,
        p_display_name: displayName.trim(),
        p_phone: phone?.trim() || null,
        p_avatar_url: avatarUrl || null,
      });

      if (regError) {
        return { error: regError.message || 'Registration failed.' };
      }

      if (regResult && typeof regResult === 'object' && 'error' in regResult) {
        return { error: (regResult as { error: string }).error };
      }

      // Auto sign-in the newly registered user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        return { error: signInError.message };
      }

      if (regResult && typeof regResult === 'object' && 'user_id' in regResult) {
        await fetchProfile((regResult as { user_id: string }).user_id);
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error: error.message };

      await fetchProfile(user.id);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'Not logged in.' };
    try {
      // Mark as suspended / deleted in profiles
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updateLocation,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
