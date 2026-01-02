import React, { useState } from 'react';
import { TimesheetEntry } from '../types';
import { Plus, Clock, Calendar } from 'lucide-react';

const Timesheet: React.FC = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([
    { id: '1', project: 'Website Redesign', task: 'Frontend Development', hours: 4, date: '2023-11-06' },
    { id: '2', project: 'Client Meeting', task: 'Requirement Gathering', hours: 2, date: '2023-11-06' },
  ]);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Timesheet</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-medium">
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
    </div>
  );
};

export default Timesheet;
