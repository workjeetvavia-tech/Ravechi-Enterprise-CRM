import React, { useEffect, useState } from 'react';
import { getProducts, addProduct, deleteProduct, subscribeToData } from '../services/dataService';
import { Product, ProductCategory } from '../types';
import { Package, Search, AlertCircle, Laptop, PenTool, Trash2, Plus, X, Filter, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<string>('All');
  
  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      category: ProductCategory.STATIONERY
  });

  useEffect(() => {
    loadProducts();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToData('products', () => {
        loadProducts();
    });

    return () => unsubscribe();
  }, []);

  const loadProducts = async () => {
    try {
        const data = await getProducts();
        setProducts(data);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this product?")) {
          await deleteProduct(id);
          // Auto-refresh handled by subscription
      }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProduct.name || !newProduct.sku) return;

      const productToAdd: Omit<Product, 'id'> = {
          name: newProduct.name!,
          sku: newProduct.sku!,
          price: Number(newProduct.price) || 0,
          stock: Number(newProduct.stock) || 0,
          category: newProduct.category || ProductCategory.STATIONERY
      };

      await addProduct(productToAdd);
      setIsAddModalOpen(false);
      setNewProduct({ category: ProductCategory.STATIONERY, price: 0, stock: 0, name: '', sku: '' });
      // Auto-refresh handled by subscription
  };

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case ProductCategory.IT_HARDWARE: return <Laptop className="text-indigo-500" size={20} />;
      case ProductCategory.STATIONERY: return <PenTool className="text-amber-500" size={20} />;
      default: return <Package className="text-slate-500" size={20} />;
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(product => {
      // 1. Search Filter
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category Filter
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

      // 3. Stock Filter
      let matchesStock = true;
      if (stockFilter === 'In Stock') matchesStock = product.stock > 0;
      if (stockFilter === 'Low Stock') matchesStock = product.stock > 0 && product.stock < 10;
      if (stockFilter === 'Out of Stock') matchesStock = product.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate Total Stock Value
  const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Inventory & Products</h2>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">Export List</button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm shadow-indigo-200 transition-colors"
            >
                <Plus size={18} /> Add Product
            </button>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-indigo-800 font-semibold">Total Stock Value</h3>
            <p className="text-2xl font-bold text-indigo-900 mt-2">₹ {totalStockValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h3 className="text-amber-800 font-semibold">Low Stock Items</h3>
            <p className="text-2xl font-bold text-amber-900 mt-2">
                {products.filter(p => p.stock < 10 && p.stock > 0).length} Items
            </p>
        </div>
        <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
            <h3 className="text-rose-800 font-semibold">Out of Stock</h3>
            <p className="text-2xl font-bold text-rose-900 mt-2">
                {products.filter(p => p.stock === 0).length} Items
            </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
             {/* Search */}
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by SKU, Name..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
                <select 
                    className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 cursor-pointer"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    {Object.values(ProductCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Stock Filter */}
            <div className="relative min-w-[180px]">
                <select 
                    className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 cursor-pointer"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                >
                    <option value="All">All Stock Status</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock (&lt; 10)</option>
                    <option value="Out of Stock">Out of Stock</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Product</th>
                <th className="p-4 font-semibold text-slate-600">SKU</th>
                <th className="p-4 font-semibold text-slate-600">Category</th>
                <th className="p-4 font-semibold text-slate-600">Price (INR)</th>
                <th className="p-4 font-semibold text-slate-600">Stock</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={7} className="p-8 text-center">Loading Inventory...</td></tr>
              ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-500">No products found matching your filters.</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{product.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{product.sku}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        {getCategoryIcon(product.category)}
                        <span className="text-sm text-slate-600">{product.category}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-800 font-medium">₹ {product.price.toLocaleString()}</td>
                  <td className="p-4 text-slate-600">{product.stock}</td>
                  <td className="p-4">
                    {product.stock === 0 ? (
                         <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-medium w-fit border border-rose-100">
                            <XCircle size={12}/> Out of Stock
                         </span>
                    ) : product.stock < 10 ? (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium w-fit border border-amber-100">
                            <AlertCircle size={12}/> Low Stock
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium w-fit border border-emerald-100">
                            <CheckCircle size={12}/> In Stock
                        </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                      >
                          <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add Product Modal */}
       {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Add New Product</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white"
                                value={newProduct.sku}
                                onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white"
                                value={newProduct.category}
                                onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}
                            >
                                {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white"
                                value={newProduct.stock}
                                onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                  
                    <div className="pt-2 flex justify-end gap-3">
                         <button 
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                         >
                            Cancel
                         </button>
                         <button 
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                         >
                            Add Product
                         </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;