import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import { addPurchaseOrder, updatePurchaseOrder } from '../services/dataService';

interface AddPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  poToEdit?: PurchaseOrder | null;
}

const AddPurchaseOrderModal: React.FC<AddPurchaseOrderModalProps> = ({ isOpen, onClose, onSaved, poToEdit }) => {
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    itemName: '',
    vendor: '',
    quantity: 1,
    estimatedCost: 0,
    status: PurchaseOrderStatus.NEEDED,
    orderDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (isOpen && poToEdit) {
      setFormData({ ...poToEdit });
    } else if (isOpen && !poToEdit) {
      setFormData({
        itemName: '',
        vendor: '',
        quantity: 1,
        estimatedCost: 0,
        status: PurchaseOrderStatus.NEEDED,
        orderDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [isOpen, poToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.vendor) return;

    if (poToEdit && formData.id) {
        await updatePurchaseOrder(formData as PurchaseOrder);
    } else {
        await addPurchaseOrder(formData as Omit<PurchaseOrder, 'id'>);
    }
    
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">
                    {poToEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item / Product Name *</label>
                    <input 
                        required
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                        value={formData.itemName}
                        onChange={e => setFormData({...formData, itemName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Supplier *</label>
                    <input 
                        required
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                        value={formData.vendor}
                        onChange={e => setFormData({...formData, vendor: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={formData.quantity}
                            onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Est. Cost (₹)</label>
                        <input 
                            type="number" 
                            min="0"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={formData.estimatedCost}
                            onChange={e => setFormData({...formData, estimatedCost: Number(e.target.value)})}
                        />
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Order Date</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                            value={formData.orderDate}
                            onChange={e => setFormData({...formData, orderDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-slate-900"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as PurchaseOrderStatus})}
                        >
                            {Object.values(PurchaseOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                
                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-900 bg-white"
                        rows={3}
                        value={formData.notes || ''}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        ></textarea>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                        <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                        Cancel
                        </button>
                        <button 
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
                        >
                        {poToEdit ? 'Save Changes' : 'Create Order'}
                        </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AddPurchaseOrderModal;