import React, { useState } from 'react';
import { TimesheetEntry } from '../types';
import { Plus, Clock, Calendar, X } from 'lucide-react';

const Timesheet: React.FC = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([
    { id: '1', project: 'Website Redesign', task: 'Frontend Development', hours: 4, date: '2023-11-06' },
    { id: '2', project: 'Client Meeting', task: 'Requirement Gathering', hours: 2, date: '2023-11-06' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<TimesheetEntry>>({ project: '', task: '', hours: 1 });

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      const entry: TimesheetEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          ...newEntry as TimesheetEntry
      };
      setEntries([entry, ...entries]);
      setIsModalOpen(false);
      setNewEntry({ project: '', task: '', hours: 1 });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Timesheet</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium"
        >
          <Plus size={18} /> Log Time
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">This Week</span>
            </div>
            <div className="flex-1 text-right text-sm text-slate-500 flex items-center justify-end gap-2">
                Total Hours: <span className="font-bold text-indigo-600 text-lg">{entries.reduce((a,b)=>a+b.hours,0)} hrs</span>
            </div>
         </div>
         <table className="w-full text-left">
             <thead className="bg-white border-b border-slate-100">
                 <tr>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Project</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Task</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Hours</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                 {entries.map(entry => (
                     <tr key={entry.id} className="hover:bg-slate-50">
                         <td className="p-4 text-sm text-slate-600">{entry.date}</td>
                         <td className="p-4 font-medium text-slate-800">{entry.project}</td>
                         <td className="p-4 text-slate-600 text-sm">{entry.task}</td>
                         <td className="p-4 text-right font-medium text-slate-800 flex items-center justify-end gap-2">
                             <Clock size={14} className="text-slate-400" /> {entry.hours}
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
                <h3 className="text-xl font-bold text-slate-800 mb-6">Log Time Entry</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Project Name</label>
                        <input className="w-full p-2 border rounded mt-1" required value={newEntry.project} onChange={e => setNewEntry({...newEntry, project: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Task Description</label>
                        <input className="w-full p-2 border rounded mt-1" required value={newEntry.task} onChange={e => setNewEntry({...newEntry, task: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Hours</label>
                        <input className="w-full p-2 border rounded mt-1" type="number" step="0.5" required value={newEntry.hours} onChange={e => setNewEntry({...newEntry, hours: Number(e.target.value)})} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Save Entry</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
