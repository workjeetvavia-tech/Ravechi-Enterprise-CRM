import React, { useEffect, useState } from 'react';
import { getPurchaseOrders, deletePurchaseOrder, updatePurchaseOrderStatus, subscribeToData } from '../services/dataService';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import { MoreHorizontal, Plus, Pencil, Trash2, AlertTriangle, Truck, Package, ShoppingCart, CheckCircle } from 'lucide-react';
import AddPurchaseOrderModal from '../components/AddPurchaseOrderModal';

const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // Dropdown & Delete State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    const unsubscribe = subscribeToData('purchaseOrders', () => {
        loadOrders();
    });
    
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);

    return () => {
        unsubscribe();
        document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getPurchaseOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (po: PurchaseOrder, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setEditingPO(po);
      setIsModalOpen(true);
      setActiveDropdownId(null);
  };

  const handleCreate = () => {
      setEditingPO(null);
      setIsModalOpen(true);
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setDeleteId(id);
      setActiveDropdownId(null);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          // Optimistic update
          setOrders(current => current.filter(o => o.id !== deleteId));
          setDeleteId(null);
          await deletePurchaseOrder(deleteId);
      }
  };

  // Move Logic
  const handleMoveNext = async (po: PurchaseOrder) => {
      const statuses = Object.values(PurchaseOrderStatus);
      const currentIndex = statuses.indexOf(po.status);
      if (currentIndex < statuses.length - 1) {
          const nextStatus = statuses[currentIndex + 1];
          // Optimistic update
          setOrders(orders.map(o => o.id === po.id ? {...o, status: nextStatus} : o));
          await updatePurchaseOrderStatus(po.id, nextStatus);
      }
  };

  const columns = [
    { id: PurchaseOrderStatus.NEEDED, title: 'Product Needed', color: 'bg-amber-50 border-amber-200', icon: Package },
    { id: PurchaseOrderStatus.ORDERED, title: 'Order Given', color: 'bg-blue-50 border-blue-200', icon: ShoppingCart },
    { id: PurchaseOrderStatus.TRANSIT, title: 'Items on the way', color: 'bg-purple-50 border-purple-200', icon: Truck },
    { id: PurchaseOrderStatus.REACHED, title: 'Items Reached', color: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  ];

  const getOrdersByStatus = (status: PurchaseOrderStatus) => {
    return orders.filter(o => o.status === status);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading orders...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
        <button 
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm shadow-indigo-200 font-medium"
        >
            <Plus size={18} /> New Order
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex flex-col h-full">
              {/* Column Header */}
              <div className={`p-4 rounded-t-xl border-t border-x ${column.color} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <column.icon size={18} className="text-slate-600 opacity-70" />
                    <h3 className="font-semibold text-slate-700">{column.title}</h3>
                </div>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                    {getOrdersByStatus(column.id).length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-slate-50/50 border-x border-b border-slate-200 p-3 overflow-y-auto space-y-3 rounded-b-xl">
                {getOrdersByStatus(column.id).map((po) => (
                  <div 
                    key={po.id} 
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-white text-xs font-medium text-slate-500 border border-slate-200 px-2 py-0.5 rounded">{po.vendor}</span>
                        <div className="flex gap-1 relative">
                             <button 
                                onClick={(e) => handleEdit(po, e)}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                                title="Edit"
                             >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => toggleDropdown(e, po.id)}
                                className={`text-slate-400 hover:text-slate-600 p-1 rounded ${activeDropdownId === po.id ? 'bg-slate-100 text-slate-600' : ''}`}
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === po.id && (
                                <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                                    <button 
                                        onClick={(e) => handleEdit(po, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteClick(po.id, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <h4 className="font-semibold text-slate-800 mb-1">{po.itemName}</h4>
                    <p className="text-sm text-slate-500 mb-2 truncate">Qty: {po.quantity}</p>
                    {po.notes && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{po.notes}</p>}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="font-semibold text-slate-700 text-sm">₹ {po.estimatedCost.toLocaleString('en-IN')}</span>
                        
                        {po.status !== PurchaseOrderStatus.REACHED && (
                            <button 
                                onClick={() => handleMoveNext(po)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Move &rarr;
                            </button>
                        )}
                    </div>
                  </div>
                ))}
                
                {getOrdersByStatus(column.id).length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-400">No orders</p>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      <AddPurchaseOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSaved={() => {/* handled by sub */}}
        poToEdit={editingPO}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Order?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Are you sure you want to delete this purchase order?
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

export default PurchaseOrders;