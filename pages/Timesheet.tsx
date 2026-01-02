import React, { useState, useEffect } from 'react';
import { TimesheetEntry } from '../types';
import { Plus, Clock, Calendar, X, Pencil, Trash2 } from 'lucide-react';

const Timesheet: React.FC = () => {
  // Load from local storage or default
  const [entries, setEntries] = useState<TimesheetEntry[]>(() => {
    const saved = localStorage.getItem('ravechi_timesheet');
    return saved ? JSON.parse(saved) : [
      { id: '1', project: 'Website Redesign', task: 'Frontend Development', hours: 4, date: '2023-11-06', startTime: '09:00', endTime: '13:00' },
      { id: '2', project: 'Client Meeting', task: 'Requirement Gathering', hours: 2, date: '2023-11-06', startTime: '14:00', endTime: '16:00' },
    ];
  });

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TimesheetEntry>>({ 
      project: '', 
      task: '', 
      hours: 0, 
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: ''
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('ravechi_timesheet', JSON.stringify(entries));
  }, [entries]);

  // Auto-calculate hours when start/end times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
        const start = new Date(`1970-01-01T${formData.startTime}`);
        const end = new Date(`1970-01-01T${formData.endTime}`);
        
        // Handle case where time crosses midnight or is invalid
        if (end.getTime() > start.getTime()) {
            const diffMs = end.getTime() - start.getTime();
            const diffHrs = diffMs / (1000 * 60 * 60);
            setFormData(prev => ({ ...prev, hours: Number(diffHrs.toFixed(2)) }));
        }
    }
  }, [formData.startTime, formData.endTime]);

  const handleCreateClick = () => {
      setEditingId(null);
      setFormData({ 
          project: '', 
          task: '', 
          hours: 0, 
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: ''
      });
      setIsModalOpen(true);
  };

  const handleEditClick = (entry: TimesheetEntry) => {
      setEditingId(entry.id);
      setFormData({ ...entry });
      setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
      if (window.confirm("Are you sure you want to delete this timesheet entry?")) {
          setEntries(entries.filter(e => e.id !== id));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.project || !formData.task) return;

      if (editingId) {
          // Edit Mode
          setEntries(entries.map(e => e.id === editingId ? { ...formData, id: editingId } as TimesheetEntry : e));
      } else {
          // Create Mode
          const entry: TimesheetEntry = {
              id: Date.now().toString(),
              date: formData.date || new Date().toISOString().split('T')[0],
              project: formData.project!,
              task: formData.task!,
              hours: Number(formData.hours) || 0,
              startTime: formData.startTime,
              endTime: formData.endTime
          };
          setEntries([entry, ...entries]);
      }
      setIsModalOpen(false);
  };

  const formatTime = (time?: string) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Timesheet</h2>
        <button 
            onClick={handleCreateClick}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium"
        >
          <Plus size={18} /> Log Time
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">All Entries</span>
            </div>
            <div className="flex-1 text-right text-sm text-slate-500 flex items-center justify-end gap-2">
                Total Hours: <span className="font-bold text-indigo-600 text-lg">{entries.reduce((a,b)=>a+(Number(b.hours)||0),0).toFixed(2)} hrs</span>
            </div>
         </div>
         <table className="w-full text-left">
             <thead className="bg-white border-b border-slate-100">
                 <tr>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Project / Task</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Time Span</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Duration</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                 {entries.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-500">No time entries logged.</td></tr>
                 ) : entries.map(entry => (
                     <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-sm text-slate-600">{entry.date}</td>
                         <td className="p-4">
                             <div className="font-medium text-slate-800">{entry.project}</div>
                             <div className="text-xs text-slate-500">{entry.task}</div>
                         </td>
                         <td className="p-4 text-sm text-slate-600">
                             {entry.startTime && entry.endTime ? (
                                 <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                                     {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                 </span>
                             ) : (
                                 <span className="text-slate-400 italic text-xs">Manual Entry</span>
                             )}
                         </td>
                         <td className="p-4 text-right font-medium text-slate-800">
                             <div className="flex items-center justify-end gap-2">
                                <Clock size={14} className="text-slate-400" /> {Number(entry.hours).toFixed(2)} hrs
                             </div>
                         </td>
                         <td className="p-4 text-right">
                             <div className="flex justify-end gap-2">
                                 <button 
                                     onClick={() => handleEditClick(entry)}
                                     className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                     title="Edit"
                                 >
                                     <Pencil size={16} />
                                 </button>
                                 <button 
                                     onClick={() => handleDeleteClick(entry.id)}
                                     className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                     title="Delete"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             </div>
                         </td>
                     </tr>
                 ))}
             </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Entry' : 'Log Time Entry'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Date *</label>
                        <input 
                            className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            type="date" 
                            required 
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Project Name *</label>
                        <input 
                            className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            required 
                            placeholder="e.g. Website Redesign"
                            value={formData.project} 
                            onChange={e => setFormData({...formData, project: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Task Description *</label>
                        <input 
                            className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            required 
                            placeholder="e.g. Frontend Development"
                            value={formData.task} 
                            onChange={e => setFormData({...formData, task: e.target.value})} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-slate-700">Start Time</label>
                            <input 
                                className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                type="time"
                                value={formData.startTime} 
                                onChange={e => setFormData({...formData, startTime: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">End Time</label>
                            <input 
                                className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                type="time"
                                value={formData.endTime} 
                                onChange={e => setFormData({...formData, endTime: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Total Hours</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50" 
                                type="number" 
                                step="0.01" 
                                required 
                                value={formData.hours} 
                                onChange={e => setFormData({...formData, hours: Number(e.target.value)})} 
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Calculated automatically from Start/End time, or enter manually.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
                        >
                            {editingId ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;