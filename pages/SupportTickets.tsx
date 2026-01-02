import React, { useState } from 'react';
import { Ticket } from '../types';
import { Plus, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: '1', subject: 'Printer Installation Issue', clientName: 'Gujarat Traders', priority: 'High', status: 'Open', date: '2023-11-01' },
    { id: '2', subject: 'Software License Renewal', clientName: 'Tech Sol', priority: 'Medium', status: 'In Progress', date: '2023-11-03' },
    { id: '3', subject: 'Wrong Cartridge Delivered', clientName: 'Creative Arts', priority: 'Low', status: 'Resolved', date: '2023-10-30' },
  ]);

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Support Tickets</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={18} /> Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Open', 'In Progress', 'Resolved'].map(status => (
              <div key={status} className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-700">{status}</h3>
                    <span className="bg-white px-2 py-0.5 rounded text-xs font-medium text-slate-500 border border-slate-200 shadow-sm">
                        {tickets.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tickets.filter(t => t.status === status).map(ticket => (
                        <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-xs text-slate-400">{ticket.date}</span>
                            </div>
                            <h4 className="font-medium text-slate-800 mb-1">{ticket.subject}</h4>
                            <p className="text-sm text-slate-500 mb-3">{ticket.clientName}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-50">
                                <MessageSquare size={14} /> 2 Comments
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default SupportTickets;
