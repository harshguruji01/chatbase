import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { en: 'Home', hi: 'होम' },
  chats: { en: 'Chats', hi: 'चैट्स' },
  search: { en: 'Search', hi: 'सर्च' },
  profile: { en: 'Profile', hi: 'प्रोफाइल' },

  // Home Feed
  daily_greeting: { en: 'Welcome to ChatBase', hi: 'चैटबेस में आपका स्वागत है' },
  thought_of_day: { en: 'Thought of the Day', hi: 'आज का सुविचार' },
  lifestyle_tips: { en: 'Lifestyle & Wellness', hi: 'लाइफस्टाइल और स्वास्थ्य' },
  refresh_feed: { en: 'Refresh Feed', hi: 'नया देखें' },
  start_chat: { en: 'Start Chatting', hi: 'बातचीत शुरू करें' },
  all: { en: 'All', hi: 'सभी' },
  thoughts: { en: 'Thoughts', hi: 'सुविचार' },
  lifestyle: { en: 'Lifestyle', hi: 'लाइफस्टाइल' },
  motivation: { en: 'Motivation', hi: 'प्रेरणा' },

  // Chats
  messages: { en: 'Messages', hi: 'संदेश' },
  no_chats_yet: { en: 'No chats yet', hi: 'अभी कोई बातचीत नहीं है' },
  start_chat_desc: { en: 'Search for friends or users to start chatting', hi: 'दोस्तों को खोजें और तुरंत बात शुरू करें' },
  type_message: { en: 'Type a message...', hi: 'संदेश टाइप करें...' },
  online: { en: 'Online', hi: 'ऑनलाइन' },
  offline: { en: 'Offline', hi: 'ऑफलाइन' },

  // Search
  search_placeholder: { en: 'Search by Name, Username or 8-digit ID...', hi: 'नाम, यूजरनेम या 8-डिजिट ID से खोजें...' },
  find_people: { en: 'Find people to connect with', hi: 'नए लोगों से जुड़ें' },
  message: { en: 'Message', hi: 'मैसेज' },
  follow: { en: 'Follow', hi: 'फॉलो करें' },
  following: { en: 'Following', hi: 'फॉलोइंग' },

  // Profile & Settings
  edit_biodata: { en: 'Edit Biodata', hi: 'बायोडाटा बदलें' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  change_password: { en: 'Change Password', hi: 'पासवर्ड बदलें' },
  theme: { en: 'Theme', hi: 'थीम' },
  dark: { en: 'Dark', hi: 'डार्क' },
  light: { en: 'Light', hi: 'लाइट' },
  auto: { en: 'Auto', hi: 'ऑटो' },
  language: { en: 'Language', hi: 'भाषा' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },
  switch_account: { en: 'Switch Account', hi: 'दूसरा अकाउंट' },
  save_changes: { en: 'Save Changes', hi: 'सुरक्षित करें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('chatbase_language');
      return saved === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('chatbase_language', lang);
    } catch (e) {
      console.warn('Failed to save language', e);
    }
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
