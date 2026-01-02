import React, { useEffect, useState } from 'react';
import { getLeads, deleteLead, subscribeToData } from '../services/dataService';
import { generateColdEmail, analyzeLeadPotential } from '../services/geminiService';
import { Lead, LeadStatus } from '../types';
import { Search, Filter, Wand2, Mail, Trash2, X, Plus, Pencil, IndianRupee, MapPin, ChevronDown, Lock, Globe, AlertTriangle } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';
import { User } from '../services/authService';

interface LeadsProps {
    user?: User | null;
}

const Leads: React.FC<LeadsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [minValueFilter, setMinValueFilter] = useState<string>('');
  const [interestFilter, setInterestFilter] = useState<string>('All');

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // Add/Edit Lead Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToData('leads', () => {
        loadLeads();
    });

    return () => unsubscribe();
  }, [user]);

  const loadLeads = async () => {
    try {
      const data = await getLeads(user?.id);
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAction = async (action: 'email' | 'analyze', lead: Lead) => {
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent('');

    if (action === 'email') {
      setModalTitle(`Drafting Email for ${lead.name}...`);
      const email = await generateColdEmail(lead);
      setAiContent(email);
    } else {
      setModalTitle(`Analyzing Deal: ${lead.company}...`);
      const analysis = await analyzeLeadPotential(lead);
      setAiContent(analysis);
    }
    setAiLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    // Store current state for rollback
    const previousLeads = [...leads];
    
    // Optimistic Update: Remove immediately
    setLeads(current => current.filter(l => l.id !== deleteId));
    setDeleteId(null); // Close modal

    try {
      await deleteLead(deleteId);
    } catch (e) {
      console.error("Failed to delete", e);
      alert("Failed to delete lead. Please try again.");
      setLeads(previousLeads); // Rollback on error
    }
  };

  const handleEdit = (lead: Lead) => {
      setEditingLead(lead);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setEditingLead(null);
      setIsModalOpen(true);
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-sky-100 text-sky-700';
      case LeadStatus.QUALIFIED: return 'bg-purple-100 text-purple-700';
      case LeadStatus.PROPOSAL: return 'bg-amber-100 text-amber-700';
      case LeadStatus.WON: return 'bg-emerald-100 text-emerald-700';
      case LeadStatus.LOST: return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Derive unique interests for the filter dropdown
  const allInterests = Array.from(new Set(leads.flatMap(l => l.interest))).sort();
  // Derive unique states for the filter dropdown
  const allStates = Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort();

  // Filter Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesState = stateFilter === 'All' || lead.state === stateFilter;
    const matchesValue = !minValueFilter || lead.value >= Number(minValueFilter);
    const matchesInterest = interestFilter === 'All' || lead.interest.includes(interestFilter);

    return matchesSearch && matchesStatus && matchesState && matchesValue && matchesInterest;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Lead Management</h2>
        <button 
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm shadow-indigo-200 font-medium"
        >
          <Plus className="mr-2" size={18} /> Add New Lead
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        
        {/* Row 1: Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search leads by name, company..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Row 2: Specific Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="relative">
                <select
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    {Object.values(LeadStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* State Filter */}
            <div className="relative">
                <select
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 appearance-none cursor-pointer"
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                >
                    <option value="All">All States</option>
                    {allStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Value Filter */}
            <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">₹</div>
                <input 
                    type="number"
                    placeholder="Min Value"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 bg-white"
                    value={minValueFilter}
                    onChange={(e) => setMinValueFilter(e.target.value)}
                />
            </div>

            {/* Interest Filter */}
            <div className="relative">
                <select
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 appearance-none cursor-pointer"
                    value={interestFilter}
                    onChange={(e) => setInterestFilter(e.target.value)}
                >
                    <option value="All">All Interests</option>
                    {allInterests.map(interest => (
                        <option key={interest} value={interest}>{interest}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Filter className="text-slate-400" size={32} />
            </div>
            <h3 className="text-slate-800 font-medium text-lg">No leads found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or search query.</p>
            <button 
                onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setStateFilter('All');
                    setMinValueFilter('');
                    setInterestFilter('All');
                }}
                className="mt-4 text-indigo-600 font-medium hover:underline"
            >
                Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">Lead Name</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">State</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">Value (INR)</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">Interests</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide">Vis.</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-800">{lead.name}</p>
                        <p className="text-sm text-slate-500">{lead.company}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(lead.status)} border border-transparent`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 text-sm">
                      {lead.state || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">₹ {lead.value.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.interest.map((int, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-slate-600 text-xs rounded border border-slate-200 font-medium">
                            {int}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                        {lead.visibility === 'private' ? (
                            <Lock size={16} className="text-slate-400" title="Private (Only you)" />
                        ) : (
                            <Globe size={16} className="text-slate-400" title="Public (Everyone)" />
                        )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAiAction('analyze', lead)}
                          title="AI Analysis"
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                        >
                          <Wand2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleAiAction('email', lead)}
                          title="Draft Email"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        >
                          <Mail size={18} />
                        </button>
                        <button 
                            onClick={() => handleEdit(lead)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Edit Lead"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => setDeleteId(lead.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Lead"
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
        )}
      </div>

      <AddLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLeadSaved={() => {/* Handled by subscription */}}
        leadToEdit={editingLead}
        user={user}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Lead?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this lead? This action cannot be undone.
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

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAiModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Wand2 className="text-purple-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{modalTitle}</h3>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                  <p className="text-slate-500 animate-pulse">Consulting Gemini AI...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
                    {aiContent}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(aiContent);
                  alert("Copied to clipboard!");
                }}
              >
                Copy Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
