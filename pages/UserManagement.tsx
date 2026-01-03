import React, { useState, useEffect } from 'react';
import { User, Plus, Shield, Mail, Pencil, Trash2, X, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AppUser } from '../types';

const UserManagement: React.FC = () => {
  // --- State ---
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('ravechi_users');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Jaydeep D', email: 'jaydeep@ravechi.com', role: 'Admin', status: 'Active' },
      { id: '2', name: 'Sales Rep 1', email: 'sales1@ravechi.com', role: 'Employee', status: 'Active' },
      { id: '3', name: 'Accountant', email: 'accounts@ravechi.com', role: 'Employee', status: 'Active' },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<AppUser, 'id'>>({
    name: '',
    email: '',
    role: 'Employee',
    status: 'Active'
  });
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('ravechi_users', JSON.stringify(users));
  }, [users]);

  // --- Handlers ---
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Employee', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          setUsers(users.filter(u => u.id !== deleteId));
          setDeleteId(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing
      setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u));
    } else {
      // Add new
      const newUser: AppUser = {
        id: Date.now().toString(),
        ...formData
      };
      setUsers([...users, newUser]);
    }
    
    setIsModalOpen(false);
  };

  // Filter users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium transition-colors"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">User Profile</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td></tr>
                  ) : filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm">
                                      {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                      <p className="font-medium text-slate-800">{u.name}</p>
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Mail size={12} /> {u.email}
                                      </p>
                                  </div>
                              </div>
                          </td>
                          <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                u.role === 'Admin' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                  : 'bg-slate-50 text-slate-700 border-slate-100'
                              }`}>
                                  <Shield size={12} /> {u.role}
                              </span>
                          </td>
                          <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                u.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                  {u.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                  {u.status}
                              </span>
                          </td>
                          <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenEdit(u)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit User"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(u.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20}/>
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User size={24} className="text-indigo-600" />
              {editingId ? 'Edit User' : 'Add New User'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-slate-900"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-slate-900"
                  placeholder="e.g. john@company.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as 'Admin' | 'Employee'})}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to remove this user from the system? This action cannot be undone.
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
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;