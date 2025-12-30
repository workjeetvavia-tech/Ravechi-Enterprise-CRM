import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, Users, FileText, Package } from 'lucide-react';
import { getLeads, getProducts, subscribeToData } from '../services/dataService';
import { Lead, Product, LeadStatus, ProductCategory } from '../types';

// Indigo, Teal, Amber, Rose, Purple, Pink
const COLORS = ['#4f46e5', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, productsData] = await Promise.all([getLeads(), getProducts()]);
        setLeads(leadsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribeLeads = subscribeToData('leads', fetchData);
    const unsubscribeProducts = subscribeToData('products', fetchData);

    return () => {
      unsubscribeLeads();
      unsubscribeProducts();
    };
  }, []);

  // --- Calculations ---

  // 1. Total Revenue (Sum of WON deals)
  const totalRevenue = leads
    .filter(l => l.status === LeadStatus.WON)
    .reduce((sum, l) => sum + l.value, 0);

  // 2. Active Leads (Not Won or Lost)
  const activeLeadsCount = leads.filter(
    l => l.status !== LeadStatus.WON && l.status !== LeadStatus.LOST
  ).length;

  // 3. Active Proposals
  const proposalsCount = leads.filter(l => l.status === LeadStatus.PROPOSAL).length;

  // 4. Inventory Value
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // --- Chart Data ---

  // Leads by Status
  const statusData = Object.values(LeadStatus).map(status => ({
    name: status,
    count: leads.filter(l => l.status === status).length
  }));

  // Inventory Value by Category
  const categoryData = Object.values(ProductCategory).map(cat => {
    const value = products
      .filter(p => p.category === cat)
      .reduce((sum, p) => sum + (p.price * p.stock), 0);
    return { name: cat, value };
  }).filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <span className="text-sm text-slate-500">Real-time Data</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Won Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">₹ {totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-emerald-600 mt-2 flex items-center font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp size={12} className="mr-1" /> Closed Deals
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        {/* Active Leads Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Leads</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeLeadsCount}</h3>
              <p className="text-xs text-slate-400 mt-2">In Pipeline</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Proposals Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Proposals</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{proposalsCount}</h3>
              <p className="text-xs text-amber-600 mt-2 font-medium">Awaiting response</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <FileText size={24} />
            </div>
          </div>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">₹ {totalInventoryValue.toLocaleString('en-IN', { notation: "compact", maximumFractionDigits: 1 })}</h3>
              <p className="text-xs text-slate-400 mt-2">{products.length} Products listed</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-rose-500">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Leads by Status</h3>
          {leads.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-12">
                <Users size={48} className="mb-2 opacity-20" />
                <p>No lead data available</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Inventory Value by Category</h3>
          {categoryData.length > 0 ? (
            <>
                <ResponsiveContainer width="100%" height="75%">
                <PieChart>
                    <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `₹ ${value.toLocaleString('en-IN')}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center flex-wrap gap-4 text-xs text-slate-600 mt-4">
                {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-medium">{entry.name}</span>
                    </div>
                ))}
                </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-12">
                <Package size={48} className="mb-2 opacity-20" />
                <p>No inventory data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;