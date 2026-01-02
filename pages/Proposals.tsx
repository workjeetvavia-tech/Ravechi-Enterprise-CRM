import React, { useState } from 'react';
import { Proposal } from '../types';
import { Plus, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([
    { id: '1', title: 'Office Stationery Annual Supply', clientName: 'Gujarat Traders', value: 120000, date: '2023-10-25', status: 'Sent' },
    { id: '2', title: 'IT Infrastructure Upgrade', clientName: 'Tech Sol', value: 450000, date: '2023-10-28', status: 'Draft' },
    { id: '3', title: 'Furniture Proposal', clientName: 'Creative Arts', value: 85000, date: '2023-10-20', status: 'Accepted' },
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Accepted': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium"><CheckCircle size={12}/> Accepted</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-medium"><XCircle size={12}/> Rejected</span>;
      case 'Sent': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium"><Clock size={12}/> Sent</span>;
      default: return <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium"><FileText size={12}/> Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Proposals</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={18} /> New Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map(proposal => (
          <div key={proposal.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <FileText size={24} />
               </div>
               {getStatusBadge(proposal.status)}
            </div>
            <h3 className="font-semibold text-slate-800 text-lg mb-1">{proposal.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{proposal.clientName}</p>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
               <span className="text-xs text-slate-400">{proposal.date}</span>
               <span className="font-bold text-slate-700">₹ {proposal.value.toLocaleString()}</span>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100">View</button>
              <button className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Proposals;
