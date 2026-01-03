import React, { useState, useEffect } from 'react';
import { User } from '../services/authService';
import { User as UserIcon, Bell, Shield, LogOut, Globe } from 'lucide-react';

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  // Notification State with LocalStorage Persistence
  const [notifications, setNotifications] = useState(() => {
    try {
        const saved = localStorage.getItem('ravechi_notifications');
        return saved ? JSON.parse(saved) : {
          emailAlerts: true,
          lowStockWarnings: true,
          weeklyReport: false
        };
    } catch (e) {
        return {
          emailAlerts: true,
          lowStockWarnings: true,
          weeklyReport: false
        };
    }
  });

  // Regional State
  const [currency, setCurrency] = useState(() => localStorage.getItem('ravechi_currency') || 'Indian Rupee (₹)');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('ravechi_timezone') || '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi');

  useEffect(() => {
    localStorage.setItem('ravechi_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ravechi_currency', currency);
  }, [currency]);
  
  useEffect(() => {
    localStorage.setItem('ravechi_timezone', timezone);
  }, [timezone]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UserIcon size={20} className="text-indigo-500" /> My Profile
            </h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium uppercase tracking-wide border border-indigo-100">
                {user?.role || 'User'}
            </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 uppercase">
                    {user?.avatar || user?.name?.substring(0,2) || 'U'}
                </div>
                <div>
                    <p className="font-medium text-slate-900">{user?.name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 font-medium">Change Avatar</button>
                </div>
            </div>
             <div className="space-y-3">
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Designation</label>
                    <p className="text-slate-800">{user?.role === 'admin' ? 'System Administrator' : 'Sales Representative'}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                    <p className="text-slate-800">Vadodara, Gujarat</p>
                 </div>
             </div>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Bell size={18} className="text-amber-500" /> Notifications
            </h3>
            <div className="space-y-4">
                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNotification('emailAlerts')}>
                    <span className="text-slate-700 text-sm">Email Alerts for New Leads</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${notifications.emailAlerts ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${notifications.emailAlerts ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </div>
                
                {/* Low Stock Toggle */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNotification('lowStockWarnings')}>
                    <span className="text-slate-700 text-sm">Low Stock Warnings</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${notifications.lowStockWarnings ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${notifications.lowStockWarnings ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </div>

                {/* Weekly Report Toggle */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNotification('weeklyReport')}>
                    <span className="text-slate-700 text-sm">Weekly Report Summary</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${notifications.weeklyReport ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${notifications.weeklyReport ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </div>
            </div>
        </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-teal-500" /> Regional Settings
            </h3>
             <div className="space-y-4">
                 <div>
                    <label className="text-sm text-slate-500 block mb-1">Currency</label>
                    <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="Indian Rupee (₹)">Indian Rupee (₹)</option>
                        <option value="US Dollar ($)">US Dollar ($)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm text-slate-500 block mb-1">Timezone</label>
                    <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                        <option value="UTC">UTC</option>
                    </select>
                 </div>
            </div>
        </div>
      </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Shield size={18} className="text-rose-500" /> Security
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your password and active sessions.</p>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors font-medium"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
       </div>
    </div>
  );
};

export default Settings;