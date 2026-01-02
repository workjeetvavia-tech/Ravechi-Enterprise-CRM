import React, { useState } from 'react';
import { FinanceRecord } from '../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Finance: React.FC = () => {
  const [records, setRecords] = useState<FinanceRecord[]>([
    { id: '1', description: 'Office Supplies Sale', amount: 12000, type: 'Income', category: 'Sales', date: '2023-11-01' },
    { id: '2', description: 'Rent Payment', amount: 25000, type: 'Expense', category: 'Rent', date: '2023-11-02' },
    { id: '3', description: 'IT Service', amount: 8000, type: 'Income', category: 'Services', date: '2023-11-03' },
  ]);

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
            <button className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 shadow-sm font-medium">
            <TrendingDown size={18} /> Add Expense
            </button>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm font-medium">
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
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {records.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50">
                            <td className="p-4 text-sm text-slate-600">{record.date}</td>
                            <td className="p-4 font-medium text-slate-800">{record.description}</td>
                            <td className="p-4 text-sm text-slate-600">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{record.category}</span>
                            </td>
                            <td className={`p-4 font-bold text-right ${record.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {record.type === 'Income' ? '+' : '-'} ₹ {record.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Finance;
