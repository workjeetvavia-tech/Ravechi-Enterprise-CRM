import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Rocket, 
  FileText, 
  Briefcase, 
  Receipt, 
  Ticket, 
  Palette, 
  CreditCard, 
  Settings,
  ShoppingCart
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: CheckSquare },
    { id: 'deals', label: 'Deal/ Opportunity', icon: Rocket },
    { id: 'purchase-orders', label: 'Purchase Order', icon: ShoppingCart },
    { id: 'proposals', label: 'Proposal', icon: FileText },
    { id: 'clients', label: 'Client', icon: Briefcase },
    { id: 'proforma', label: 'Proforma Invoice', icon: Receipt },
    { id: 'invoices', label: 'Invoice', icon: Receipt },
    { id: 'tickets', label: 'Support Ticket', icon: Ticket },
    { id: 'inventory', label: 'Product/ Services', icon: Palette },
    { id: 'finance', label: 'Finance', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col shadow-2xl overflow-y-auto
      `}>
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent break-words leading-tight">
            Ravechi Enterprises Pvt. Ltd
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">CRM SOFTWARE</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                ${currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={18} className={currentView === item.id ? 'text-indigo-200' : ''} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3 bg-slate-800/50 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Current User</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-xs text-slate-400">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;