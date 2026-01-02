import React, { useEffect, useState, useRef } from 'react';
import { getLeads, updateLeadStatus, updateLead, deleteLead, subscribeToData } from '../services/dataService';
import { Lead, LeadStatus } from '../types';
import { MoreHorizontal, Plus, Pencil, XCircle, X, Trash2, AlertTriangle } from 'lucide-react';
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

  // Dropdown & Delete State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Lost Reason Modal State
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);
  const [lostReason, setLostReason] = useState('');

  useEffect(() => {
    loadLeads();

    const unsubscribe = subscribeToData('leads', () => {
        loadLeads();
    });
    
    // Close dropdowns on click outside
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);

    return () => {
        unsubscribe();
        document.removeEventListener('click', handleClickOutside);
    };
  }, [user]);

  const loadLeads = async () => {
    try {
      const data = await getLeads(user?.id);
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setEditingLead(lead);
      setIsModalOpen(true);
      setActiveDropdownId(null);
  };

  const handleCreate = () => {
      setEditingLead(null);
      setIsModalOpen(true);
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setDeleteId(id);
      setActiveDropdownId(null);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          // Optimistic update
          setLeads(current => current.filter(l => l.id !== deleteId));
          setDeleteId(null);
          
          try {
              await deleteLead(deleteId);
          } catch (e) {
              console.error("Failed to delete deal", e);
              loadLeads(); // Revert on error
          }
      }
  };

  const columns = [
    { id: LeadStatus.NEW, title: 'New Leads', color: 'bg-slate-50 border-slate-200' },
    { id: LeadStatus.CONTACTED, title: 'Contacted', color: 'bg-indigo-50 border-indigo-200' },
    { id: LeadStatus.QUALIFIED, title: 'Qualified', color: 'bg-purple-50 border-purple-200' },
    { id: LeadStatus.PROPOSAL, title: 'Proposal Sent', color: 'bg-amber-50 border-amber-200' },
    { id: LeadStatus.WON, title: 'Closed Won', color: 'bg-emerald-50 border-emerald-200' },
    { id: LeadStatus.LOST, title: 'Lost', color: 'bg-rose-50 border-rose-200' },
  ];

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  // Move to Next Stage Logic
  const handleMoveNext = async (lead: Lead) => {
      const statuses = Object.values(LeadStatus);
      const currentIndex = statuses.indexOf(lead.status);
      // Ensure we don't move past Won or accidentally into Lost without reason
      if (currentIndex < statuses.length - 2) { 
          const nextStatus = statuses[currentIndex + 1];
          // Skip 'Lost' in the sequential flow if it happens to be next in enum (it's usually last)
          if(nextStatus === LeadStatus.LOST) return;

          // Optimistic update
          const updatedLeads = leads.map(l => l.id === lead.id ? {...l, status: nextStatus} : l);
          setLeads(updatedLeads);
          await updateLeadStatus(lead.id, nextStatus);
      }
  };

  // Open Lost Modal
  const handleMarkLostClick = (lead: Lead) => {
      setLeadToLose(lead);
      setLostReason('');
      setIsLostModalOpen(true);
  };

  // Confirm Lost
  const confirmMarkLost = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!leadToLose) return;

      const updatedNote = leadToLose.notes 
          ? `${leadToLose.notes}\n\n[LOST REASON]: ${lostReason}` 
          : `[LOST REASON]: ${lostReason}`;

      const updatedLead = { 
          ...leadToLose, 
          status: LeadStatus.LOST,
          notes: updatedNote
      };

      // Optimistic update
      setLeads(leads.map(l => l.id === leadToLose.id ? updatedLead : l));
      
      // Update DB
      await updateLead(updatedLead);
      
      setIsLostModalOpen(false);
      setLeadToLose(null);
      setLostReason('');
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
                        <div className="flex gap-1 relative">
                             <button 
                                onClick={(e) => handleEdit(lead, e)}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                                title="Edit Deal"
                             >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => toggleDropdown(e, lead.id)}
                                className={`text-slate-400 hover:text-slate-600 p-1 rounded ${activeDropdownId === lead.id ? 'bg-slate-100 text-slate-600' : ''}`}
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === lead.id && (
                                <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                                    <button 
                                        onClick={(e) => handleEdit(lead, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteClick(lead.id, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">{lead.name}</h4>
                    <p className="text-sm text-slate-500 mb-3 truncate">{lead.notes}</p>
                    
                    {/* Reason Display for Lost Leads */}
                    {lead.status === LeadStatus.LOST && lead.notes && lead.notes.includes('[LOST REASON]') && (
                         <div className="mb-3 p-2 bg-rose-50 border border-rose-100 rounded text-xs text-rose-700 italic">
                             {lead.notes.split('[LOST REASON]:')[1]}
                         </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="font-semibold text-slate-700 text-sm">₹ {lead.value.toLocaleString('en-IN')}</span>
                        
                        <div className="flex gap-2">
                            {/* Mark Lost Button - Only for active deals */}
                            {lead.status !== LeadStatus.WON && lead.status !== LeadStatus.LOST && (
                                <button
                                    onClick={() => handleMarkLostClick(lead)}
                                    className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-100 transition-colors"
                                    title="Mark as Lost"
                                >
                                    <XCircle size={12} /> Lost
                                </button>
                            )}

                            {/* Move Next Button */}
                            {lead.status !== LeadStatus.WON && lead.status !== LeadStatus.LOST && (
                                <button 
                                    onClick={() => handleMoveNext(lead)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Move &rarr;
                                </button>
                            )}
                        </div>
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
      
      {/* Add/Edit Modal */}
      <AddLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLeadSaved={() => {/* Handled by subscription */}}
        leadToEdit={editingLead}
        user={user}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Deal?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this deal? This action cannot be undone.
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

      {/* Lost Reason Modal */}
      {isLostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsLostModalOpen(false)}></div>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Mark Deal as Lost</h3>
                      <button onClick={() => setIsLostModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" size={20}/></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                      Please provide a reason for losing the deal with <span className="font-semibold text-slate-700">{leadToLose?.company}</span>.
                  </p>
                  <form onSubmit={confirmMarkLost}>
                      <textarea 
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-slate-900 resize-none"
                          rows={3}
                          placeholder="Reason (e.g., Price too high, Competitor won...)"
                          required
                          value={lostReason}
                          onChange={(e) => setLostReason(e.target.value)}
                          autoFocus
                      ></textarea>
                      <div className="flex justify-end gap-3 mt-4">
                          <button 
                              type="button" 
                              onClick={() => setIsLostModalOpen(false)}
                              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 shadow-sm"
                          >
                              Confirm Lost
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DealsPipeline;