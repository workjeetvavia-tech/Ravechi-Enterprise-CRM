import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react';

const Clients: React.FC = () => {
  // Mock Data
  const [clients, setClients] = useState<Client[]>([
    { id: '1', name: 'Rahul Patel', company: 'Gujarat Traders', email: 'rahul@gtraders.com', phone: '+91 9876543210', address: 'CG Road, Ahmedabad', status: 'Active' },
    { id: '2', name: 'Amit Shah', company: 'Tech Sol', email: 'amit@techsol.in', phone: '+91 9898989898', address: 'Ring Road, Surat', status: 'Active' },
    { id: '3', name: 'Sneha Mehta', company: 'Creative Arts', email: 'sneha@arts.com', phone: '+91 7654321098', address: 'Alkapuri, Vadodara', status: 'Inactive' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Clients</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
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
              {filtered.map(client => (
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
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" /> {client.address}
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
