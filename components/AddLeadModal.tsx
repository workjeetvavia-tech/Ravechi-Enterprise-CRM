import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { addLead, updateLead } from '../services/dataService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSaved: () => void;
  leadToEdit?: Lead | null;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadSaved, leadToEdit }) => {
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    state: '',
    status: LeadStatus.NEW,
    value: 0,
    notes: '',
    interest: []
  });
  const [interestInput, setInterestInput] = useState('');

  // Populate form when opening in edit mode
  useEffect(() => {
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
        interest: []
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
            interest: interestArray
        };
        await addLead(leadToAdd);
    }
    
    onLeadSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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