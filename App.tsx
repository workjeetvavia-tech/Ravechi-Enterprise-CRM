import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, Mic } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Inventory from './pages/Inventory';
import DealsPipeline from './pages/DealsPipeline';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AiAssistant from './pages/AiAssistant';
import Clients from './pages/Clients';
import Proposals from './pages/Proposals';
import Invoices from './pages/Invoices';
import SupportTickets from './pages/SupportTickets';
import Finance from './pages/Finance';
import Timesheet from './pages/Timesheet';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import LiveAssistant from './pages/LiveAssistant';
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
      case 'live-assistant': 
        return <LiveAssistant />;
      case 'clients':
        return <Clients />;
      case 'proposals':
        return <Proposals />;
      case 'invoices':
        return <Invoices key="invoice" type="Invoice" />;
      case 'proforma':
        return <Invoices key="proforma" type="Proforma" />;
      case 'tickets':
        return <SupportTickets />;
      case 'finance':
        return <Finance />;
      case 'timesheet':
        return <Timesheet />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UserManagement />;
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
    if (authPage === 'signup') {
      return <Signup onSignup={handleLogin} onNavigateToLogin={() => setAuthPage('login')} />;
    }
    return <Login onLogin={handleLogin} onNavigateToSignup={() => setAuthPage('signup')} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden z-10 flex-shrink-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600">
               <Menu size={24} />
             </button>
             <h1 className="font-bold text-slate-800">Ravechi Enterprises</h1>
           </div>
           <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs border border-indigo-200">
             {currentUser?.avatar || 'U'}
           </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {renderContent()}
          </div>
        </main>
        
        {/* Floating Action Buttons */}
        {currentView !== 'ai-tools' && currentView !== 'live-assistant' && (
           <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
             <button 
                onClick={() => setCurrentView('live-assistant')}
                className="bg-white text-indigo-600 p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center border border-indigo-100 group"
                title="Live Audio Assistant"
             >
               <span className="p-1">
                 <Mic size={20} />
               </span>
             </button>
             
             <button 
               onClick={() => setCurrentView('ai-tools')}
               className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 group"
               title="Text AI Assistant"
             >
               <span className="bg-white/20 p-1 rounded-full">
                 <Sparkles size={20} />
               </span>
               <span className="font-semibold pr-1 hidden group-hover:inline-block transition-all">Ask AI</span>
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;