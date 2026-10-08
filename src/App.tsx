import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider } from './context/PremiumContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { SplashScreen } from './components/auth/SplashScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { MainLayout } from './components/layout/MainLayout';
import { LiveUpdateSync } from './components/common/LiveUpdateSync';
import { IncomingCallModal } from './components/call/IncomingCallModal';
import { ActiveCallModal } from './components/call/ActiveCallModal';
import { FloatingCallBubble } from './components/call/FloatingCallBubble';

const ChatBaseApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // While splash screen is animating, keep it on
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If still loading session from Supabase
  if (isLoading) {
    return null;
  }

  // If user is not authenticated, show Login or Register
  if (!user) {
    return authView === 'login' ? (
      <LoginScreen onGoToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterScreen onGoToLogin={() => setAuthView('login')} />
    );
  }

  // Main Application (Chat, Nearby, Search, Profile)
  return (
    <>
      <MainLayout />
      <IncomingCallModal />
      <ActiveCallModal />
      <FloatingCallBubble />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <PremiumProvider>
              <ChatProvider>
                <CallProvider>
                  <LiveUpdateSync />
                  <ChatBaseApp />
                </CallProvider>
              </ChatProvider>
            </PremiumProvider>
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

