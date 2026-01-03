import React, { useState, useEffect } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Inventory from './pages/Inventory';
import DealsPipeline from './pages/DealsPipeline';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import AiAssistant from './pages/AiAssistant';
import Clients from './pages/Clients';
import Proposals from './pages/Proposals';
import Invoices from './pages/Invoices';
import SupportTickets from './pages/SupportTickets';
import Finance from './pages/Finance';
import PurchaseOrders from './pages/PurchaseOrders';
import { User, clearUserSession } from './services/authService';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth Pages State: login | signup | verify | forgot-password
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'verify' | 'forgot-password'>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
             if (user.emailVerified) {
                 const appUser: User = {
                    id: user.uid,
                    email: user.email || '',
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    role: 'employee',
                    avatar: user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'
                 };
                 setCurrentUser(appUser);
                 setIsAuthenticated(true);
             } else {
                 // User exists but email not verified.
                 // We don't log them in, they must manually verify.
                 // We rely on Login page logic to show the verification screen if they try to login again.
                 setIsAuthenticated(false);
                 setCurrentUser(null);
             }
        } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setCurrentView('dashboard');
            // Keep current authPage if it is 'verify' or 'signup' or 'forgot-password', otherwise default to login
            if (authPage === 'verify' || authPage === 'signup' || authPage === 'forgot-password') {
                // do nothing, stay on current auth view
            } else {
                setAuthPage('login');
            }
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authPage]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await clearUserSession();
    setAuthPage('login');
  };

  const handleGoToVerification = (email: string) => {
      setPendingEmail(email);
      setAuthPage('verify');
  };

  const handleGoToForgotPassword = (email: string) => {
      setPendingEmail(email);
      setAuthPage('forgot-password');
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
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'settings':
        return <Settings user={currentUser} onLogout={handleLogout} />;
      case 'ai-tools': 
        return <AiAssistant />;
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
    if (authPage === 'verify') {
        return <EmailVerification email={pendingEmail} onNavigateToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'forgot-password') {
        return <ForgotPassword initialEmail={pendingEmail} onNavigateToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'signup') {
      return <Signup onNavigateToVerification={handleGoToVerification} onNavigateToLogin={() => setAuthPage('login')} />;
    }
    return <Login 
        onLogin={handleLogin} 
        onNavigateToVerification={handleGoToVerification} 
        onNavigateToSignup={() => setAuthPage('signup')}
        onNavigateToForgotPassword={handleGoToForgotPassword}
    />;
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
             <h1 className="font-bold text-slate-800">Ravechi Enterprises Pvt. Ltd</h1>
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
        {currentView !== 'ai-tools' && (
           <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
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