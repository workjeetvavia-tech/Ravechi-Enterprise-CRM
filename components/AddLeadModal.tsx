import React, { useState, useEffect } from 'react';
import { X, Globe, Lock, Users, CheckSquare, Square } from 'lucide-react';
import { Lead, LeadStatus, AppUser } from '../types';
import { addLead, updateLead, getAppUsers } from '../services/dataService';
import { User } from '../services/authService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSaved: () => void;
  leadToEdit?: Lead | null;
  user?: User | null;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadSaved, leadToEdit, user }) => {
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    state: '',
    status: LeadStatus.NEW,
    value: 0,
    notes: '',
    interest: [],
    visibility: 'public',
    sharedWith: []
  });
  const [interestInput, setInterestInput] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);

  // Populate form when opening in edit mode
  useEffect(() => {
    // Fetch users for the sharing list
    const users = getAppUsers();
    setAvailableUsers(users);

    if (isOpen && leadToEdit) {
      setNewLead({ ...leadToEdit });
      setInterestInput(leadToEdit.interest ? leadToEdit.interest.join(', ') : '');
    } else if (isOpen && !leadToEdit) {
      // Reset if opening in add mode
      setNewLead({
        name: '',
        company: '',
        email: '',
        phone: '',
        state: '',
        status: LeadStatus.NEW,
        value: 0,
        notes: '',
        interest: [],
        visibility: 'public',
        sharedWith: []
      });
      setInterestInput('');
    }
  }, [isOpen, leadToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.company) return;

    const interestArray = interestInput.split(',').map(s => s.trim()).filter(s => s !== '');

    if (leadToEdit && newLead.id) {
        // Update existing lead
        const updatedLead: Lead = {
            ...leadToEdit,
            ...newLead as Lead,
            interest: interestArray
        };
        await updateLead(updatedLead);
    } else {
        // Add new lead
        const leadToAdd: Omit<Lead, 'id'> = {
            name: newLead.name!,
            company: newLead.company!,
            email: newLead.email || '',
            phone: newLead.phone || '',
            state: newLead.state || '',
            status: newLead.status || LeadStatus.NEW,
            value: Number(newLead.value) || 0,
            notes: newLead.notes || '',
            lastContact: new Date().toISOString().split('T')[0],
            interest: interestArray,
            visibility: newLead.visibility || 'public',
            sharedWith: newLead.sharedWith || [],
            ownerId: user?.id || ''
        };
        await addLead(leadToAdd);
    }
    
    onLeadSaved();
    onClose();
  };

  const toggleSharedUser = (userId: string) => {
      const currentShared = newLead.sharedWith || [];
      if (currentShared.includes(userId)) {
          setNewLead({ ...newLead, sharedWith: currentShared.filter(id => id !== userId) });
      } else {
          setNewLead({ ...newLead, sharedWith: [...currentShared, userId] });
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20">
                <h3 className="text-xl font-bold text-slate-800">
                    {leadToEdit ? 'Edit Deal / Lead' : 'Add New Deal / Lead'}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                        <input 
                            required
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.name || ''}
                            onChange={e => setNewLead({...newLead, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                        <input 
                            required
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.company || ''}
                            onChange={e => setNewLead({...newLead, company: e.target.value})}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.email || ''}
                            onChange={e => setNewLead({...newLead, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.phone || ''}
                            onChange={e => setNewLead({...newLead, phone: e.target.value})}
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Gujarat"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.state || ''}
                            onChange={e => setNewLead({...newLead, state: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-slate-900"
                            value={newLead.status}
                            onChange={e => setNewLead({...newLead, status: e.target.value as LeadStatus})}
                        >
                            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Est. Value (₹)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={newLead.value}
                            onChange={e => setNewLead({...newLead, value: Number(e.target.value)})}
                        />
                </div>
                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Interests (comma separated)</label>
                        <input 
                        type="text" 
                        placeholder="e.g. Laptops, A4 Paper"
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                        value={interestInput}
                        onChange={e => setInterestInput(e.target.value)}
                        />
                </div>
                
                {/* Visibility Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Who can see this lead?</label>
                    <div className="grid grid-cols-3 gap-2">
                        <label className={`
                            flex flex-col items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center
                            ${newLead.visibility === 'public' 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}>
                            <input 
                                type="radio" 
                                name="visibility" 
                                className="hidden" 
                                checked={newLead.visibility === 'public'}
                                onChange={() => setNewLead({...newLead, visibility: 'public'})}
                            />
                            <Globe size={20} />
                            <span className="font-medium text-xs">Everyone</span>
                        </label>

                        <label className={`
                            flex flex-col items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center
                            ${newLead.visibility === 'private' 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}>
                            <input 
                                type="radio" 
                                name="visibility" 
                                className="hidden" 
                                checked={newLead.visibility === 'private'}
                                onChange={() => setNewLead({...newLead, visibility: 'private'})}
                            />
                            <Lock size={20} />
                            <span className="font-medium text-xs">Only Me</span>
                        </label>

                        <label className={`
                            flex flex-col items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center
                            ${newLead.visibility === 'shared' 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}>
                            <input 
                                type="radio" 
                                name="visibility" 
                                className="hidden" 
                                checked={newLead.visibility === 'shared'}
                                onChange={() => setNewLead({...newLead, visibility: 'shared'})}
                            />
                            <Users size={20} />
                            <span className="font-medium text-xs">Specific People</span>
                        </label>
                    </div>

                    {/* User Selection List (Only if 'shared' is selected) */}
                    {newLead.visibility === 'shared' && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Select Users to Share With:</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {availableUsers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No other users found.</p>
                                ) : availableUsers.map(u => (
                                    <div 
                                        key={u.id} 
                                        className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-indigo-300"
                                        onClick={() => toggleSharedUser(u.id)}
                                    >
                                        {newLead.sharedWith?.includes(u.id) 
                                            ? <CheckSquare size={16} className="text-indigo-600" /> 
                                            : <Square size={16} className="text-slate-300" />
                                        }
                                        <span className="text-sm text-slate-700">{u.name}</span>
                                        <span className="text-xs text-slate-400 ml-auto">{u.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                        rows={3}
                        value={newLead.notes || ''}
                        onChange={e => setNewLead({...newLead, notes: e.target.value})}
                        ></textarea>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                        <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                        Cancel
                        </button>
                        <button 
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
                        >
                        {leadToEdit ? 'Save Changes' : 'Add Lead'}
                        </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AddLeadModal;