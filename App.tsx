import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Inventory from './pages/Inventory';
import DealsPipeline from './pages/DealsPipeline';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AiAssistant from './pages/AiAssistant';
import { User, getCurrentUser, clearUserSession } from './services/authService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check initial session
    const checkSession = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                setCurrentUser(user);
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    checkSession();

    // 2. Listen for auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
             // Map the session user to our app user format manually or refetch
             const appUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                role: session.user.user_metadata?.role || 'employee',
                avatar: session.user.user_metadata?.name ? session.user.user_metadata.name.substring(0, 2).toUpperCase() : 'U'
             };
             setCurrentUser(appUser);
             setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setCurrentView('dashboard');
            setAuthPage('login');
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    // Handled by onAuthStateChange, but we can set state immediately for better UX
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await clearUserSession();
    // State update handled by onAuthStateChange
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={currentUser} />;
      case 'leads':
        return <Leads user={currentUser} />;
      case 'inventory':
        return <Inventory user={currentUser} />;
      case 'deals':
        return <DealsPipeline user={currentUser} />;
      case 'settings':
        return <Settings user={currentUser} onLogout={handleLogout} />;
      case 'ai-tools':
        return <AiAssistant />;
      default:
        return <Dashboard user={currentUser} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authPage === 'login' ? (
      <Login 
        onLogin={handleLogin} 
        onNavigateToSignup={() => setAuthPage('signup')} 
      />
    ) : (
      <Signup 
        onSignup={handleLogin} 
        onNavigateToLogin={() => setAuthPage('login')} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 md:hidden flex-shrink-0 z-10 shadow-sm">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-3 text-lg font-bold text-slate-800">Ravechi Enterprises CRM</h1>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto h-full">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;