import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const Reports: React.FC = () => {
  const salesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 7500 },
    { name: 'May', sales: 6000 },
    { name: 'Jun', sales: 8500 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm font-medium">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
              <h3 className="font-semibold text-slate-800 mb-6">Sales Performance (6 Months)</h3>
              <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
              <h3 className="font-semibold text-slate-800 mb-6">Lead Growth</h3>
              <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Reports;
