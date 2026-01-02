import React, { useState } from 'react';
import { Invoice } from '../types';
import { Plus, Download, Filter } from 'lucide-react';

interface InvoicesProps {
  type: 'Invoice' | 'Proforma';
}

const Invoices: React.FC<InvoicesProps> = ({ type }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', number: 'INV-001', clientName: 'Gujarat Traders', date: '2023-11-01', dueDate: '2023-11-15', amount: 12000, status: 'Paid', type: 'Invoice' },
    { id: '2', number: 'INV-002', clientName: 'Tech Sol', date: '2023-11-05', dueDate: '2023-11-20', amount: 45000, status: 'Sent', type: 'Invoice' },
    { id: '3', number: 'PI-101', clientName: 'Creative Arts', date: '2023-11-10', dueDate: '2023-11-25', amount: 8500, status: 'Draft', type: 'Proforma' },
  ]);

  const filtered = invoices.filter(inv => inv.type === type);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'text-emerald-600 bg-emerald-50';
      case 'Overdue': return 'text-rose-600 bg-rose-50';
      case 'Sent': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{type === 'Proforma' ? 'Proforma Invoices' : 'Tax Invoices'}</h2>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm font-medium">
            <Filter size={18} /> Filter
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Create {type === 'Proforma' ? 'Proforma' : 'Invoice'}
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600 text-sm">Number</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Client</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Due Date</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Amount</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No {type.toLowerCase()}s found.</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-indigo-600">{inv.number}</td>
                <td className="p-4 text-slate-800">{inv.clientName}</td>
                <td className="p-4 text-slate-600 text-sm">{inv.date}</td>
                <td className="p-4 text-slate-600 text-sm">{inv.dueDate}</td>
                <td className="p-4 font-medium text-slate-800">₹ {inv.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-slate-400 hover:text-indigo-600 p-1" title="Download PDF">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
