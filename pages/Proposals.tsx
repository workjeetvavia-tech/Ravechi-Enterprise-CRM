import React, { useState, useEffect } from 'react';
import { Proposal } from '../types';
import { Plus, FileText, CheckCircle, XCircle, Clock, X, Eye, Pencil, Trash2, Calendar, AlertTriangle, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Proposals: React.FC = () => {
  // --- State ---
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('ravechi_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [currentProposal, setCurrentProposal] = useState<Partial<Proposal>>({
      title: '', clientName: '', value: 0, status: 'Draft', description: '', validUntil: ''
  });

  // View State
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('ravechi_proposals', JSON.stringify(proposals));
  }, [proposals]);

  // --- Handlers ---

  const handleCreate = () => {
    setCurrentProposal({ title: '', clientName: '', value: 0, status: 'Draft', description: '', validUntil: '' });
    setIsFormModalOpen(true);
  };

  const handleEdit = (proposal: Proposal) => {
    setCurrentProposal({ ...proposal });
    setIsFormModalOpen(true);
  };

  const handleView = (proposal: Proposal) => {
    setViewProposal(proposal);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setProposals(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentProposal.title || !currentProposal.clientName) return;

      if (currentProposal.id) {
          // Update Existing
          setProposals(prev => prev.map(p => p.id === currentProposal.id ? { ...p, ...currentProposal } as Proposal : p));
      } else {
          // Create New
          const newProp: Proposal = {
              id: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              ...currentProposal as Proposal
          };
          setProposals([newProp, ...proposals]);
      }
      setIsFormModalOpen(false);
  };

  const handleDownloadPdf = async () => {
      const element = document.getElementById('proposal-print');
      if (!element || !viewProposal) return;
      
      setIsDownloading(true);
      try {
          const canvas = await html2canvas(element, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Proposal_${viewProposal.title.replace(/\s+/g, '_')}.pdf`);
      } catch (error) {
          console.error('Error generating PDF:', error);
          alert("Failed to generate PDF");
      } finally {
          setIsDownloading(false);
      }
  };

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
        <button 
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> New Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText size={32} />
            </div>
            <h3 className="text-slate-800 font-medium text-lg">No proposals yet</h3>
            <p className="text-slate-500 mb-6">Create your first proposal to track potential deals.</p>
            <button onClick={handleCreate} className="text-indigo-600 font-medium hover:underline">Create Proposal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map(proposal => (
            <div key={proposal.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <FileText size={24} />
                    </div>
                    {getStatusBadge(proposal.status)}
                </div>
                <h3 className="font-semibold text-slate-800 text-lg mb-1 truncate" title={proposal.title}>{proposal.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{proposal.clientName}</p>
                
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12}/> {proposal.date}
                    </span>
                    <span className="font-bold text-slate-700">₹ {proposal.value.toLocaleString()}</span>
                </div>
                
                <div className="mt-4 flex gap-2">
                    <button 
                        onClick={() => handleView(proposal)}
                        className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-2"
                    >
                        <Eye size={16}/> View
                    </button>
                    <button 
                        onClick={() => handleEdit(proposal)}
                        className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                        title="Edit"
                    >
                        <Pencil size={18}/>
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(proposal.id)}
                        className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
                        title="Delete"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- Create / Edit Modal --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsFormModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{currentProposal.id ? 'Edit Proposal' : 'New Proposal'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Proposal Title *</label>
                        <input className="w-full p-2 border rounded mt-1" required value={currentProposal.title} onChange={e => setCurrentProposal({...currentProposal, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Client Name *</label>
                        <input className="w-full p-2 border rounded mt-1" required value={currentProposal.clientName} onChange={e => setCurrentProposal({...currentProposal, clientName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-slate-700">Estimated Value (₹)</label>
                            <input className="w-full p-2 border rounded mt-1" type="number" value={currentProposal.value} onChange={e => setCurrentProposal({...currentProposal, value: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Valid Until</label>
                            <input className="w-full p-2 border rounded mt-1" type="date" value={currentProposal.validUntil} onChange={e => setCurrentProposal({...currentProposal, validUntil: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select 
                            className="w-full p-2 border rounded mt-1"
                            value={currentProposal.status}
                            onChange={e => setCurrentProposal({...currentProposal, status: e.target.value as any})}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Description / Scope of Work</label>
                        <textarea 
                            className="w-full p-2 border rounded mt-1" 
                            rows={4}
                            value={currentProposal.description}
                            onChange={e => setCurrentProposal({...currentProposal, description: e.target.value})}
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                        {currentProposal.id ? 'Update Proposal' : 'Create Proposal'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- View Modal --- */}
      {isViewModalOpen && viewProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl min-h-[80vh] flex flex-col relative">
                {/* Header Toolbar */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl print:hidden">
                    <h3 className="font-bold text-slate-700">Proposal Details</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isDownloading ? 'Generating...' : <><Download size={16}/> Download PDF</>}
                        </button>
                        <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Document Content */}
                <div className="p-8 md:p-12 flex-1 overflow-y-auto" id="proposal-print">
                    <div className="flex justify-between items-start mb-8 border-b-2 border-indigo-600 pb-6">
                        <div>
                             <h1 className="text-3xl font-bold text-indigo-900">PROPOSAL</h1>
                             <p className="text-slate-500 mt-1 uppercase tracking-wider font-medium">{viewProposal.title}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-lg font-bold text-slate-800">Ravechi Enterprises Pvt. Ltd</div>
                             <div className="text-sm text-slate-600">GF-15, Silverline complex, Opp. BBC Tower</div>
                             <div className="text-sm text-slate-600">Sayajiunj, Vadodara, Gujarat</div>
                             <div className="text-sm text-slate-600">GSTIN: 24AAICR0144B1Z0</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prepared For</h4>
                            <p className="text-lg font-semibold text-slate-800">{viewProposal.clientName}</p>
                            <p className="text-sm text-slate-600">Client ID: #{viewProposal.clientName.substring(0,3).toUpperCase()}-001</p>
                        </div>
                        <div className="text-right">
                             <div className="mb-2">
                                <span className="text-slate-500 text-sm">Date:</span>
                                <span className="ml-2 font-medium text-slate-800">{viewProposal.date}</span>
                             </div>
                             <div>
                                <span className="text-slate-500 text-sm">Valid Until:</span>
                                <span className="ml-2 font-medium text-slate-800">{viewProposal.validUntil || 'N/A'}</span>
                             </div>
                        </div>
                    </div>

                    <div className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100">
                        <h4 className="font-semibold text-slate-800 mb-2">Project Description / Scope</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {viewProposal.description || "No description provided."}
                        </p>
                    </div>

                    <div className="flex justify-end border-t border-slate-200 pt-6">
                        <div className="w-1/2 md:w-1/3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600">Total Estimated Value</span>
                                <span className="text-xl font-bold text-slate-800">₹ {viewProposal.value.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    viewProposal.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                    viewProposal.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    Status: {viewProposal.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-dashed border-slate-300">
                        <p className="text-center text-slate-400 text-sm italic">Thank you for considering Ravechi Enterprises Pvt. Ltd for your business needs.</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Proposal?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this proposal? This action cannot be undone.
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

export default Proposals;