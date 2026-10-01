import { createClient } from '@supabase/supabase-js';

// --- CROSS-SUBDOMAIN COOKIE + LOCALSTORAGE STORAGE ADAPTER ---
// Enables seamless Single Sign-On (SSO) across webguruji.online, store.webguruji.online, and chat.webguruji.online
export const getSharedCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
    try {
      return decodeURIComponent(parts.pop()!.split(';').shift()!);
    } catch {
      return null;
    }
  }
  return null;
};

export const setSharedCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  const hostname = window.location.hostname;
  let domainStr = '';
  if (hostname === 'webguruji.online' || hostname.endsWith('.webguruji.online')) {
    domainStr = '; domain=.webguruji.online';
  }
  const secureStr = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + domainStr + '; SameSite=Lax' + secureStr;
};

export const removeSharedCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  let domainStr = '';
  if (hostname === 'webguruji.online' || hostname.endsWith('.webguruji.online')) {
    domainStr = '; domain=.webguruji.online';
  }
  document.cookie = name + '=; path=/; max-age=0' + domainStr + '; SameSite=Lax';
  document.cookie = name + '=; path=/; max-age=0; SameSite=Lax';
};

export const crossDomainStorage = {
  getItem: (key: string): string | null => {
    try {
      const local = localStorage.getItem(key);
      if (local) {
        setSharedCookie(key, local);
        return local;
      }
    } catch {}

    const fromCookie = getSharedCookie(key);
    if (fromCookie) {
      try {
        localStorage.setItem(key, fromCookie);
      } catch {}
      return fromCookie;
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
    setSharedCookie(key, value);
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
    removeSharedCookie(key);
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wumdbpyhpblvgjttsbpv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xLqKY9N62MXb6ELG-5trig_RlJs_n-l';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: crossDomainStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
