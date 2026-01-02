import React, { useState, useEffect } from 'react';
import { Ticket, TicketComment } from '../types';
import { Plus, MessageSquare, AlertCircle, Trash2, X, ChevronRight, ChevronLeft, Send, User, Pencil } from 'lucide-react';

const SupportTickets: React.FC = () => {
  // --- Local Storage Persistence ---
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('ravechi_tickets');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({ subject: '', clientName: '', priority: 'Medium', status: 'Open' });
  
  // View/Edit Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('ravechi_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // --- Actions ---

  const handleSaveTicket = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTicket.subject) return;

      if (newTicket.id) {
          // Edit Mode
          setTickets(prev => prev.map(t => t.id === newTicket.id ? { ...t, ...newTicket } as Ticket : t));
          
          // Update selected ticket view if open
          if(selectedTicket?.id === newTicket.id) {
              setSelectedTicket(prev => prev ? { ...prev, ...newTicket } as Ticket : null);
          }
      } else {
          // Create Mode
          const t: Ticket = {
              id: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              comments: [],
              ...newTicket as Ticket
          };
          setTickets([t, ...tickets]);
      }
      
      setIsCreateModalOpen(false);
      setNewTicket({ subject: '', clientName: '', priority: 'Medium', status: 'Open' });
  };

  const openCreateModal = () => {
      setNewTicket({ subject: '', clientName: '', priority: 'Medium', status: 'Open' });
      setIsCreateModalOpen(true);
  };

  const openEditModal = (ticket: Ticket, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setNewTicket({ ...ticket });
      setIsCreateModalOpen(true);
  };

  const deleteTicket = () => {
      if(deleteId) {
          setTickets(prev => prev.filter(t => t.id !== deleteId));
          if(selectedTicket?.id === deleteId) setSelectedTicket(null);
          setDeleteId(null);
      }
  };

  const moveTicket = (ticket: Ticket, direction: 'next' | 'prev') => {
      const statuses: Ticket['status'][] = ['Open', 'In Progress', 'Resolved'];
      const currentIndex = statuses.indexOf(ticket.status);
      let newIndex = currentIndex;

      if (direction === 'next' && currentIndex < statuses.length - 1) {
          newIndex++;
      } else if (direction === 'prev' && currentIndex > 0) {
          newIndex--;
      }

      if (newIndex !== currentIndex) {
          const newStatus = statuses[newIndex];
          const updatedTicket = { ...ticket, status: newStatus };
          setTickets(prev => prev.map(t => t.id === ticket.id ? updatedTicket : t));
          if(selectedTicket?.id === ticket.id) setSelectedTicket(updatedTicket);
      }
  };

  const addComment = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedTicket || !newComment.trim()) return;

      const comment: TicketComment = {
          id: Date.now().toString(),
          text: newComment,
          author: 'You', // In a real app, use currentUser.name
          date: new Date().toLocaleString()
      };

      const updatedTicket = {
          ...selectedTicket,
          comments: [...(selectedTicket.comments || []), comment]
      };

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setNewComment('');
  };

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
        <button 
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
          {['Open', 'In Progress', 'Resolved'].map(status => (
              <div key={status} className="bg-slate-50/50 rounded-xl flex flex-col border border-slate-200 h-full overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-100/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">{status}</h3>
                    <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                        {tickets.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {tickets.filter(t => t.status === status).map(ticket => (
                        <div 
                            key={ticket.id} 
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-xs text-slate-400">{ticket.date}</span>
                            </div>
                            <h4 className="font-medium text-slate-800 mb-1 line-clamp-2">{ticket.subject}</h4>
                            <p className="text-sm text-slate-500 mb-3">{ticket.clientName}</p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <MessageSquare size={14} /> {ticket.comments?.length || 0}
                                </div>
                                
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    {status !== 'Open' && (
                                        <button 
                                            onClick={() => moveTicket(ticket, 'prev')}
                                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                            title="Move Back"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={(e) => openEditModal(ticket, e)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                        title="Edit Ticket"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button 
                                        onClick={() => setDeleteId(ticket.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                        title="Delete Ticket"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {status !== 'Resolved' && (
                                        <button 
                                            onClick={() => moveTicket(ticket, 'next')}
                                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                            title="Move Forward"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {tickets.filter(t => t.status === status).length === 0 && (
                        <div className="text-center py-8 opacity-40">
                            <p className="text-xs text-slate-500">No tickets</p>
                        </div>
                    )}
                  </div>
              </div>
          ))}
      </div>

      {/* --- View Ticket / Comments Modal --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                                {selectedTicket.priority}
                             </span>
                             <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                {selectedTicket.status}
                             </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedTicket.subject}</h3>
                        <p className="text-sm text-slate-500">{selectedTicket.clientName} • Opened on {selectedTicket.date}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => openEditModal(selectedTicket, e)} 
                            className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded"
                            title="Edit"
                        >
                            <Pencil size={20}/>
                        </button>
                        <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                {/* Body - Comments */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <MessageSquare size={16} /> Activity & Comments
                    </h4>
                    
                    <div className="space-y-4">
                        {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                            <p className="text-center text-slate-400 text-sm py-4 italic">No comments yet. Start the conversation.</p>
                        ) : (
                            selectedTicket.comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                                        {comment.author.charAt(0)}
                                    </div>
                                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-200 max-w-[85%]">
                                        <div className="flex justify-between items-center gap-4 mb-1">
                                            <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                                            <span className="text-[10px] text-slate-400">{comment.date}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer - Input */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <form onSubmit={addComment} className="flex gap-2">
                        <input 
                            className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Type a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!newComment.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-100">
                        <button 
                            onClick={() => setDeleteId(selectedTicket.id)}
                            className="text-rose-600 text-sm flex items-center gap-1 hover:underline"
                        >
                            <Trash2 size={14} /> Delete Ticket
                        </button>
                        
                        {/* Status Mover in Modal */}
                        <div className="flex gap-2">
                            {selectedTicket.status !== 'Resolved' && (
                                <button 
                                    onClick={() => moveTicket(selectedTicket, 'next')}
                                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 font-medium border border-indigo-200"
                                >
                                    Move to Next Stage &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Create/Edit Ticket Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{newTicket.id ? 'Edit Support Ticket' : 'New Support Ticket'}</h3>
                <form onSubmit={handleSaveTicket} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Subject</label>
                        <input className="w-full p-2 border rounded mt-1" required value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Client Name</label>
                        <input className="w-full p-2 border rounded mt-1" required value={newTicket.clientName} onChange={e => setNewTicket({...newTicket, clientName: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Priority</label>
                        <select className="w-full p-2 border rounded mt-1" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select className="w-full p-2 border rounded mt-1" value={newTicket.status} onChange={e => setNewTicket({...newTicket, status: e.target.value as any})}>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                        {newTicket.id ? 'Save Changes' : 'Create Ticket'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Ticket?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this ticket? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteId(null)}
                            className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={deleteTicket}
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

export default SupportTickets;