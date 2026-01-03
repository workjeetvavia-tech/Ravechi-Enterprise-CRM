import React, { useState, useEffect, useRef } from 'react';
import { Client } from '../types';
import { getClients, addClient, updateClient, deleteClient, subscribeToData } from '../services/dataService';
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({ name: '', company: '', email: '', phone: '', address: '', status: 'Active' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    const unsubscribe = subscribeToData('clients', loadClients);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        unsubscribe();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadClients = async () => {
      try {
          const data = await getClients();
          setClients(data);
      } finally {
          setLoading(false);
      }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newClient.name) return;

      if (editingId) {
          await updateClient({ ...newClient, id: editingId } as Client);
      } else {
          await addClient(newClient as Omit<Client, 'id'>);
      }
      
      // Close and Reset
      setIsModalOpen(false);
      setNewClient({ name: '', company: '', email: '', phone: '', address: '', status: 'Active' });
      setEditingId(null);
  };

  const handleEditClick = (client: Client) => {
      setNewClient({ ...client });
      setEditingId(client.id);
      setIsModalOpen(true);
      setActiveDropdownId(null);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteId(id);
      setActiveDropdownId(null);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          // Optimistic update
          setClients(prev => prev.filter(c => c.id !== deleteId));
          setDeleteId(null);
          await deleteClient(deleteId);
      }
  };

  const handleOpenAddModal = () => {
      setNewClient({ name: '', company: '', email: '', phone: '', address: '', status: 'Active' });
      setEditingId(null);
      setIsModalOpen(true);
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Clients</h2>
        <button 
            onClick={handleOpenAddModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        <div className="overflow-visible">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-sm">Client Name</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Contact Info</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Address</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading clients...</td></tr>
              ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No clients found matching your search.</td></tr>
              ) : filtered.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.company}</div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} /> {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={14} /> {client.phone}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                     <div className="flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" /> 
                        <span className="truncate max-w-[200px]">{client.address}</span>
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative">
                    <button 
                        onClick={(e) => toggleDropdown(client.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${activeDropdownId === client.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdownId === client.id && (
                        <div 
                            ref={dropdownRef}
                            className="absolute right-8 top-8 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden"
                        >
                            <button 
                                onClick={() => handleEditClick(client)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                            <button 
                                onClick={() => handleDeleteClick(client.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add/Edit Client Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
                <form onSubmit={handleSaveClient} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Client Name *</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Company *</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" required value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Address</label>
                        <textarea className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" rows={2} value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900" 
                            value={newClient.status} 
                            onChange={e => setNewClient({...newClient, status: e.target.value as any})}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm mt-2">
                        {editingId ? 'Update Client' : 'Save Client'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Client?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this client? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteId(null)}
                            className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Clients;