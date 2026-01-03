import React, { useState, useEffect } from 'react';
import { FinanceRecord } from '../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, X, Trash2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Finance: React.FC = () => {
  // Load from local storage or use defaults
  const [records, setRecords] = useState<FinanceRecord[]>(() => {
    const saved = localStorage.getItem('ravechi_finance');
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<FinanceRecord>>({ description: '', amount: 0, category: '', type: 'Income' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('ravechi_finance', JSON.stringify(records));
  }, [records]);

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      const r: FinanceRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          ...newRecord as FinanceRecord
      };
      setRecords([r, ...records]);
      setIsModalOpen(false);
      setNewRecord({ description: '', amount: 0, category: '', type: 'Income' });
  };

  const openModal = (type: 'Income' | 'Expense') => {
      setNewRecord({ ...newRecord, type });
      setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          setRecords(records.filter(r => r.id !== deleteId));
          setDeleteId(null);
      }
  };

  const totalIncome = records.filter(r => r.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = records.filter(r => r.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const data = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expense', amount: totalExpense },
  ];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Finance Overview</h2>
        <div className="flex gap-2">
            <button onClick={() => openModal('Expense')} className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 shadow-sm font-medium">
            <TrendingDown size={18} /> Add Expense
            </button>
            <button onClick={() => openModal('Income')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm font-medium">
            <TrendingUp size={18} /> Add Income
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Total Income</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹ {totalIncome.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">₹ {totalExpense.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Net Profit</p>
            <h3 className={`text-2xl font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                ₹ {(totalIncome - totalExpense).toLocaleString()}
            </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart Section */}
         <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
            <h3 className="font-semibold text-slate-800 mb-4">Cash Flow</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Transactions List */}
         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
            </div>
            <table className="w-full text-left">
                <thead className="border-b border-slate-100 bg-white">
                    <tr>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {records.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No transactions recorded.</td></tr>
                    ) : records.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm text-slate-600">{record.date}</td>
                            <td className="p-4 font-medium text-slate-800">{record.description}</td>
                            <td className="p-4 text-sm text-slate-600">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{record.category}</span>
                            </td>
                            <td className={`p-4 font-bold text-right ${record.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {record.type === 'Income' ? '+' : '-'} ₹ {record.amount.toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDeleteClick(record.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Record"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Add {newRecord.type}</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" required value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" required value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
                        <input className="w-full p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" type="number" required value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} />
                    </div>
                    <button type="submit" className={`w-full text-white py-2 rounded-lg font-medium ${newRecord.type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                        Save {newRecord.type}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Record?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this transaction record?
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

export default Finance;