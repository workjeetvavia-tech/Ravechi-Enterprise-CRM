import React, { useEffect, useState } from 'react';
import { getLeads, updateLeadStatus, subscribeToData } from '../services/dataService';
import { Lead, LeadStatus } from '../types';
import { MoreHorizontal, Plus, Pencil } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';
import { User } from '../services/authService';

interface DealsPipelineProps {
    user?: User | null;
}

const DealsPipeline: React.FC<DealsPipelineProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();

    const unsubscribe = subscribeToData('leads', () => {
        loadLeads();
    });
    
    return () => unsubscribe();
  }, [user]);

  const loadLeads = async () => {
    try {
      const data = await getLeads(user?.id);
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click event if needed later
      setEditingLead(lead);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setEditingLead(null);
      setIsModalOpen(true);
  };

  const columns = [
    { id: LeadStatus.NEW, title: 'New Leads', color: 'bg-slate-50 border-slate-200' },
    { id: LeadStatus.CONTACTED, title: 'Contacted', color: 'bg-indigo-50 border-indigo-200' },
    { id: LeadStatus.QUALIFIED, title: 'Qualified', color: 'bg-purple-50 border-purple-200' },
    { id: LeadStatus.PROPOSAL, title: 'Proposal Sent', color: 'bg-amber-50 border-amber-200' },
    { id: LeadStatus.WON, title: 'Closed Won', color: 'bg-emerald-50 border-emerald-200' },
  ];

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  // Mock drag and drop handler (in a real app, use react-dnd or dnd-kit)
  const handleMoveNext = async (lead: Lead) => {
      // Simple logic to move to next stage for demo
      const statuses = Object.values(LeadStatus);
      const currentIndex = statuses.indexOf(lead.status);
      if (currentIndex < statuses.length - 2) { // Don't move past Won/Lost
          const nextStatus = statuses[currentIndex + 1];
          // Optimistic update
          const updatedLeads = leads.map(l => l.id === lead.id ? {...l, status: nextStatus} : l);
          setLeads(updatedLeads);
          await updateLeadStatus(lead.id, nextStatus);
          // Auto-refresh handled by subscription
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading pipeline...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Deals Pipeline</h2>
        <button 
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm shadow-indigo-200 font-medium"
        >
            <Plus size={18} /> New Deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex flex-col h-full">
              {/* Column Header */}
              <div className={`p-4 rounded-t-xl border-t border-x ${column.color} flex justify-between items-center`}>
                <h3 className="font-semibold text-slate-700">{column.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                    {getLeadsByStatus(column.id).length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-slate-50/50 border-x border-b border-slate-200 p-3 overflow-y-auto space-y-3 rounded-b-xl">
                {getLeadsByStatus(column.id).map((lead) => (
                  <div 
                    key={lead.id} 
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-white text-xs font-medium text-slate-500 border border-slate-200 px-2 py-0.5 rounded">{lead.company}</span>
                        <div className="flex gap-1">
                             <button 
                                onClick={(e) => handleEdit(lead, e)}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                                title="Edit Deal"
                             >
                                <Pencil size={14} />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">{lead.name}</h4>
                    <p className="text-sm text-slate-500 mb-3 truncate">{lead.notes}</p>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="font-semibold text-slate-700 text-sm">₹ {lead.value.toLocaleString('en-IN')}</span>
                        {lead.status !== LeadStatus.WON && (
                             <button 
                                onClick={() => handleMoveNext(lead)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                Move &rarr;
                             </button>
                        )}
                    </div>
                  </div>
                ))}
                
                {getLeadsByStatus(column.id).length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-400">No deals in this stage</p>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <AddLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLeadSaved={() => {/* Handled by subscription */}}
        leadToEdit={editingLead}
        user={user}
      />
    </div>
  );
};

export default DealsPipeline;