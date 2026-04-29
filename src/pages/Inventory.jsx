import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Edit2, Trash2, AlertCircle, RefreshCw, X, CheckCircle } from 'lucide-react';
import api from '../api/api';
import { getVendors } from '../api/vendorService';
import { useConfirmation } from '../context/ConfirmationContext';

const getStatusConfig = (stock) => {
  if (stock <= 0)  return { label: 'Out of Stock', bg: 'bg-red-100',    text: 'text-red-700' };
  if (stock < 20)  return { label: 'Low Stock',    bg: 'bg-yellow-100', text: 'text-yellow-700' };
  return                   { label: 'In Stock',     bg: 'bg-green-100',  text: 'text-green-700' };
};

const EMPTY_FORM = { name: '', sku: '', category: '', price: '', stockLevel: '', reorderLevel: '10', description: '', vendorId: '' };

const Inventory = () => {
  const [parts, setParts]           = useState([]);
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add, obj = edit
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);
  const { confirm }                 = useConfirmation();

  const fetchParts = () => {
    setLoading(true);
    Promise.all([api.get('/parts'), getVendors()])
      .then(([p, v]) => { setParts(p.data); setVendors(v); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchParts(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd  = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); };
  const openEdit = (part, e) => {
    e.stopPropagation();
    setForm({
      name: part.name, sku: part.sku, category: part.category,
      price: part.price, stockLevel: part.stockLevel,
      reorderLevel: part.reorderLevel, description: part.description,
      vendorId: part.vendorId
    });
    setEditTarget(part);
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, price: parseFloat(form.price), stockLevel: parseInt(form.stockLevel), reorderLevel: parseInt(form.reorderLevel), vendorId: parseInt(form.vendorId) || 0 };
    try {
      if (editTarget) {
        await api.put(`/parts/${editTarget.id}`, { ...payload, id: editTarget.id });
        showToast('Part updated successfully');
      } else {
        await api.post('/parts', payload);
        showToast('Part added to inventory');
      }
      setShowModal(false);
      fetchParts();
    } catch { showToast('Operation failed. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Remove Part?',
      message: `Are you sure you want to remove "${name}" from inventory? This action is permanent.`,
      confirmText: 'Remove Part',
      type: 'danger'
    });

    if (!isConfirmed) return;
    try {
      await api.delete(`/parts/${id}`);
      setParts(parts.filter(p => p.id !== id));
      showToast('Part removed from inventory');
    } catch { showToast('Failed to delete part', 'error'); }
  };

  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Synchronizing inventory...</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage your vehicle parts stock</p>
        </div>
        <button onClick={openAdd} className="btn-green text-sm px-4 py-2 flex items-center gap-2 rounded-lg">
          <Plus className="w-4 h-4" /> Add New Part
        </button>
      </div>

      {parts.some(p => p.stockLevel < 20) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Low Stock Alert</p>
            <p className="text-sm text-yellow-700 mt-0.5">{parts.filter(p => p.stockLevel < 20).length} item(s) are running low and need reordering.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg flex items-center gap-3 px-4">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input type="text" placeholder="Search by name, category or SKU..."
          className="flex-1 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="w-px h-5 bg-slate-200"></div>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 font-medium py-3 px-1 hover:text-green-600 transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Part</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-16 text-center">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No parts found in inventory</p>
                  <button onClick={openAdd} className="mt-3 text-sm text-green-600 font-medium hover:underline">+ Add your first part</button>
                </td></tr>
              ) : filtered.map(part => {
                const s = getStatusConfig(part.stockLevel);
                return (
                  <tr key={part.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{part.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{part.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{part.category || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{part.stockLevel} units</p>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${part.stockLevel > 20 ? 'bg-green-500' : part.stockLevel > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (part.stockLevel / 100) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">${parseFloat(part.price).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${s.bg} ${s.text}`}>{s.label}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => openEdit(part, e)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={e => handleDelete(part.id, part.name, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {parts.length} items</p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">{editTarget ? 'Edit Part' : 'Add New Part'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Part Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="e.g. Brake Pad Set" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">SKU *</label>
                  <input required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="e.g. BP-2024-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
                  <input required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="e.g. Brakes" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit Price ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stock Level *</label>
                  <input required type="number" min="0" value={form.stockLevel} onChange={e => setForm({...form, stockLevel: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reorder Level</label>
                  <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                    placeholder="10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier</label>
                  <select value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 bg-white transition-colors">
                    <option value="">No supplier assigned</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 resize-none transition-colors"
                    placeholder="Optional part description..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : editTarget ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-green-200 text-slate-800'}`}>
          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${toast.type === 'error' ? 'text-red-500' : 'text-green-600'}`} />
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;
