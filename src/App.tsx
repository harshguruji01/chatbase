import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { SplashScreen } from './components/auth/SplashScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { MainLayout } from './components/layout/MainLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';

const ChatBaseApp: React.FC = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentRoute, setCurrentRoute] = useState<'main' | 'admin'>('main');

  useEffect(() => {
    // Check if user navigated to /admin or #admin
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('admin') || hash.includes('admin')) {
      setCurrentRoute('admin');
    }
  }, []);

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

  // If authenticated user navigated to Admin dashboard
  if (currentRoute === 'admin') {
    return <AdminDashboard onBack={() => setCurrentRoute('main')} />;
  }

  // Main Application (Chat, Nearby, Search, Profile)
  return (
    <MainLayout
      onGoToAdmin={() => {
        if (isAdmin) setCurrentRoute('admin');
      }}
    />
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <ChatBaseApp />
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
