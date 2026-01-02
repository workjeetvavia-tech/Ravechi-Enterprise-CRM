import React from 'react';
import { User, Plus, Shield, Mail } from 'lucide-react';

const UserManagement: React.FC = () => {
  const users = [
    { id: 1, name: 'Jaydeep D', email: 'jaydeep@ravechi.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Sales Rep 1', email: 'sales1@ravechi.com', role: 'Employee', status: 'Active' },
    { id: 3, name: 'Accountant', email: 'accounts@ravechi.com', role: 'Employee', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                      {u.name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-medium text-slate-800">{u.name}</p>
                                      <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="p-4">
                              <span className="flex items-center gap-1 text-sm text-slate-700">
                                  <Shield size={14} className="text-indigo-500" /> {u.role}
                              </span>
                          </td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {u.status}
                              </span>
                          </td>
                          <td className="p-4 text-right">
                              <button className="text-indigo-600 hover:underline text-sm font-medium">Edit</button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default UserManagement;
