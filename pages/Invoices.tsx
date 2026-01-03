import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Download, Filter, Eye, Printer, X, Pencil } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoicesProps {
  type: 'Invoice' | 'Proforma';
}

// --- Helper: Number to Words (Simplified for Indian Context) ---
const numToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString() as any).length > 9) return 'Overflow';
  const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only' : 'only';
  return str;
};

const Invoices: React.FC<InvoicesProps> = ({ type }) => {
  // LocalStorage Persistence
  const STORAGE_KEY = `ravechi_${type.toLowerCase()}s`;
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientName: '',
    clientAddress: '',
    clientGstin: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [],
    status: 'Draft'
  });
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({ description: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 });

  // Sync state to local storage whenever invoices change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices, STORAGE_KEY]);

  const handleCreate = () => {
    setFormData({
        // Ensure id is undefined for new creations
        id: undefined, 
        clientName: '',
        clientAddress: '',
        clientGstin: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [],
        status: 'Draft',
        number: `${type === 'Invoice' ? 'INV' : 'PI'}-${new Date().getFullYear()}-${invoices.length + 101}`
    });
    setIsModalOpen(true);
  };

  const handleEdit = (inv: Invoice) => {
      setFormData({ ...inv });
      setIsModalOpen(true);
  };

  const addItem = () => {
      if(!currentItem.description || !currentItem.rate) return;
      const newItem = { ...currentItem, id: Date.now().toString() } as InvoiceItem;
      setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
      setCurrentItem({ description: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 });
  };

  const removeItem = (id: string) => {
      setFormData(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const calculateTotal = (items: InvoiceItem[]) => {
      return items.reduce((acc, item) => {
          const taxable = item.quantity * item.rate;
          const tax = taxable * (item.gstRate / 100);
          return acc + taxable + tax;
      }, 0);
  };

  const saveInvoice = () => {
      if(!formData.clientName || !formData.items?.length) return;
      const totalAmount = calculateTotal(formData.items);
      
      if (formData.id) {
          // Edit Mode
          setInvoices(prev => prev.map(inv => inv.id === formData.id ? { ...formData, amount: Math.round(totalAmount) } as Invoice : inv));
      } else {
          // Create Mode
          const newInvoice: Invoice = {
              id: Date.now().toString(),
              ...formData as Invoice,
              type,
              amount: Math.round(totalAmount)
          };
          setInvoices([newInvoice, ...invoices]);
      }

      setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Overdue': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Sent': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Cancelled': return 'text-slate-500 bg-slate-100 border-slate-200 decoration-slate-400';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  // --- Invoice Viewer Component (Indian Format) ---
  const InvoiceViewer = ({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const subTotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const totalTax = invoice.items.reduce((acc, item) => acc + ((item.quantity * item.rate) * (item.gstRate/100)), 0);
    const grandTotal = Math.round(subTotal + totalTax);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('invoice-print');
        if (!element) return;
        
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${type}_${invoice.number}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-4xl min-h-[90vh] shadow-2xl rounded-lg flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg print:hidden">
                    <h3 className="font-bold text-slate-800">Preview {type}</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownloadPdf} 
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <span>Generating...</span>
                            ) : (
                                <>
                                    <Download size={18} /> Download PDF
                                </>
                            )}
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="p-8 md:p-12 flex-1 bg-white relative" id="invoice-print">
                    {/* Watermark for Cancelled */}
                    {invoice.status === 'Cancelled' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                            <div className="transform -rotate-45 border-8 border-slate-200 text-slate-200 text-9xl font-black uppercase p-8 opacity-50">
                                CANCELLED
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-indigo-600 pb-6 relative z-10">
                        <div>
                            <h1 className="text-3xl font-bold text-indigo-900 uppercase tracking-wide">{type === 'Invoice' ? 'Tax Invoice' : 'Proforma Invoice'}</h1>
                            <p className="text-slate-500 mt-1">#{invoice.number}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-800">Ravechi Enterprises Pvt. Ltd</h2>
                            <p className="text-sm text-slate-600">GF-15, Silverline complex, Opp. BBC Tower</p>
                            <p className="text-sm text-slate-600">Sayajiunj, Vadodara, Gujarat</p>
                            <p className="text-sm text-slate-600">GSTIN: <span className="font-semibold">24AAICR0144B1Z0</span></p>
                            <p className="text-sm text-slate-600">Email: accounts@ravechi.com</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 relative z-10">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                            <div className="text-slate-800 font-semibold text-lg">{invoice.clientName}</div>
                            <div className="text-slate-600 text-sm whitespace-pre-wrap">{invoice.clientAddress}</div>
                            {invoice.clientGstin && (
                                <div className="text-slate-600 text-sm mt-1">GSTIN: <span className="font-medium">{invoice.clientGstin}</span></div>
                            )}
                        </div>
                        <div className="flex-1 md:text-right">
                            <div className="mb-2">
                                <span className="text-slate-500 text-sm">Invoice Date:</span>
                                <span className="ml-2 font-medium text-slate-800">{invoice.date}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-slate-500 text-sm">Due Date:</span>
                                <span className="ml-2 font-medium text-slate-800">{invoice.dueDate || 'Immediate'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 text-sm">Place of Supply:</span>
                                <span className="ml-2 font-medium text-slate-800">24-Gujarat</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8 border-collapse relative z-10">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider text-right">
                                <th className="py-3 px-2 text-left">#</th>
                                <th className="py-3 px-2 text-left w-1/3">Item Description</th>
                                <th className="py-3 px-2 text-center">HSN/SAC</th>
                                <th className="py-3 px-2 text-center">Qty</th>
                                <th className="py-3 px-2">Rate</th>
                                <th className="py-3 px-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="py-3 px-2 text-left text-slate-400">{index + 1}</td>
                                    <td className="py-3 px-2 text-left font-medium">
                                        {item.description}
                                        <div className="text-xs text-slate-400 mt-0.5">GST @ {item.gstRate}%</div>
                                    </td>
                                    <td className="py-3 px-2 text-center">{item.hsn}</td>
                                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                                    <td className="py-3 px-2 text-right">₹{item.rate.toLocaleString()}</td>
                                    <td className="py-3 px-2 text-right">₹{(item.quantity * item.rate).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals & Tax Breakdown */}
                    <div className="flex justify-end mb-8 relative z-10">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Taxable Amount</span>
                                <span>₹{subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>CGST (9%)</span>
                                <span>₹{(totalTax / 2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>SGST (9%)</span>
                                <span>₹{(totalTax / 2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                                <span>Grand Total</span>
                                <span>₹{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Amount Words */}
                    <div className="mb-8 p-3 bg-slate-50 rounded border border-slate-100 relative z-10">
                        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Amount in Words:</span>
                        <span className="text-sm font-medium text-slate-800 italic">{numToWords(grandTotal)} Rupees Only</span>
                    </div>

                    {/* Footer / Bank Details */}
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 relative z-10">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-2">Bank Details</h4>
                            <p className="text-xs text-slate-600">Bank: HDFC Bank</p>
                            <p className="text-xs text-slate-600">A/c No: 50200012345678</p>
                            <p className="text-xs text-slate-600">IFSC: HDFC0001234</p>
                            <p className="text-xs text-slate-600">Branch: Sayajigunj, Vadodara</p>
                        </div>
                        <div className="text-right flex flex-col justify-end">
                            <div className="h-16 mb-2">
                                {/* Signature Placeholder */}
                            </div>
                            <p className="text-sm font-bold text-slate-800">For, Ravechi Enterprises Pvt. Ltd</p>
                            <p className="text-xs text-slate-500 mt-1">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{type === 'Proforma' ? 'Proforma Invoices' : 'Tax Invoices'}</h2>
        <div className="flex gap-2">
            <button 
                onClick={handleCreate}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
                <Plus size={18} /> Create {type === 'Proforma' ? 'Proforma' : 'Invoice'}
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600 text-sm">Number</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Client</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Amount</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No invoices generated yet.</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-indigo-600">{inv.number}</td>
                <td className="p-4 text-slate-800">{inv.clientName}</td>
                <td className="p-4 text-slate-600 text-sm">{inv.date}</td>
                <td className="p-4 font-medium text-slate-800">₹ {inv.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setViewInvoice(inv)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100" title="View/Print">
                            <Eye size={18} />
                        </button>
                        <button onClick={() => handleEdit(inv)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded hover:bg-indigo-50" title="Edit">
                            <Pencil size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Viewer Modal */}
      {viewInvoice && <InvoiceViewer invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Create/Edit Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-slate-800">{formData.id ? `Edit ${type}` : `New ${type}`}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Client Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700 border-b pb-2">Client Details</h4>
                            <input 
                                className="w-full p-2 border rounded" 
                                placeholder="Client Name"
                                value={formData.clientName}
                                onChange={e => setFormData({...formData, clientName: e.target.value})}
                            />
                            <textarea 
                                className="w-full p-2 border rounded" 
                                placeholder="Address"
                                rows={2}
                                value={formData.clientAddress}
                                onChange={e => setFormData({...formData, clientAddress: e.target.value})}
                            />
                            <input 
                                className="w-full p-2 border rounded" 
                                placeholder="Client GSTIN"
                                value={formData.clientGstin}
                                onChange={e => setFormData({...formData, clientGstin: e.target.value})}
                            />
                        </div>
                        <div className="space-y-4">
                             <h4 className="font-semibold text-slate-700 border-b pb-2">Invoice Details</h4>
                             <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500">Invoice Number</label>
                                    <input className="w-full p-2 border rounded bg-slate-50" value={formData.number} disabled />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500">Status</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Sent">Sent</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                             </div>
                             <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500">Date</label>
                                    <input type="date" className="w-full p-2 border rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500">Due Date</label>
                                    <input type="date" className="w-full p-2 border rounded" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Items</h4>
                        <table className="w-full text-sm text-left mb-2">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="p-2">Description</th>
                                    <th className="p-2 w-24">HSN</th>
                                    <th className="p-2 w-20">Qty</th>
                                    <th className="p-2 w-32">Rate</th>
                                    <th className="p-2 w-20">GST %</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items?.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">{item.description}</td>
                                        <td className="p-2">{item.hsn}</td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2">₹{item.rate}</td>
                                        <td className="p-2">{item.gstRate}%</td>
                                        <td className="p-2"><button onClick={() => removeItem(item.id)} className="text-red-500"><X size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Add Item Row */}
                        <div className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                            <input className="flex-grow p-2 border rounded text-sm" placeholder="Item Description" value={currentItem.description} onChange={e => setCurrentItem({...currentItem, description: e.target.value})} />
                            <input className="w-24 p-2 border rounded text-sm" placeholder="HSN" value={currentItem.hsn} onChange={e => setCurrentItem({...currentItem, hsn: e.target.value})} />
                            <input className="w-20 p-2 border rounded text-sm" type="number" placeholder="Qty" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} />
                            <input className="w-32 p-2 border rounded text-sm" type="number" placeholder="Rate" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: Number(e.target.value)})} />
                            <select className="w-20 p-2 border rounded text-sm" value={currentItem.gstRate} onChange={e => setCurrentItem({...currentItem, gstRate: Number(e.target.value)})}>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                            <button onClick={addItem} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Plus size={18}/></button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t">
                         <div className="text-right space-y-1">
                             <p className="text-sm text-slate-500">Total Amount (Inc. GST)</p>
                             <p className="text-2xl font-bold text-slate-800">₹{calculateTotal(formData.items || []).toLocaleString()}</p>
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                    <button onClick={saveInvoice} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm font-medium">Save {type}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;