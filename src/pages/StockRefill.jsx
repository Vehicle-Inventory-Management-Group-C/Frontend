import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Minus, Trash2, CheckCircle, ChevronDown, RefreshCw, ClipboardList, History } from 'lucide-react';
import { getVendors } from '../api/vendorService';
import { getParts } from '../api/partsService';
import api from '../api/api';

// ── Purchase Audit History Component ─────────────────────────────────────────
const PurchaseHistory = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    api.get('/purchases')
      .then(r => setPurchases(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading purchase history...</p>
    </div>
  );

  if (purchases.length === 0) return (
    <div className="bg-white rounded-lg border border-slate-200 p-16 text-center">
      <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-sm text-slate-400">No purchase orders recorded yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Purchase Order Audit Trail</h2>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{purchases.length} orders</span>
      </div>
      {purchases.map(p => (
        <div key={p.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  PO-{String(p.id).padStart(4, '0')} · {p.vendor?.name || 'Unknown Vendor'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  {' · '}{p.items?.length || 0} line item{p.items?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">${p.totalCost?.toFixed(2)}</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </button>
          {expanded === p.id && p.items?.length > 0 && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs">
                    <th className="text-left py-2 px-5 font-semibold text-slate-500 uppercase tracking-wide">Part</th>
                    <th className="text-center py-2 px-4 font-semibold text-slate-500 uppercase tracking-wide">Qty Added</th>
                    <th className="text-right py-2 px-4 font-semibold text-slate-500 uppercase tracking-wide">Unit Cost</th>
                    <th className="text-right py-2 px-5 font-semibold text-slate-500 uppercase tracking-wide">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {p.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-5">
                        <p className="font-medium text-slate-900">{item.part?.name || `Part #${item.partId}`}</p>
                        <p className="text-xs text-slate-400">{item.part?.sku}</p>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">+{item.quantityBought}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600">${item.unitCost?.toFixed(2)}</td>
                      <td className="py-2.5 px-5 text-right font-semibold text-slate-900">
                        ${(item.unitCost * item.quantityBought).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan="3" className="py-2.5 px-5 text-right text-xs font-semibold text-slate-500 uppercase">Total Cost</td>
                    <td className="py-2.5 px-5 text-right text-sm font-bold text-slate-900">${p.totalCost?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main StockRefill Component ────────────────────────────────────────────────
const StockRefill = () => {
  const [vendors, setVendors]         = useState([]);
  const [parts, setParts]             = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [search, setSearch]           = useState('');
  const [manifest, setManifest]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [activeTab, setActiveTab]     = useState('create');

  useEffect(() => {
    Promise.all([getVendors(), getParts()])
      .then(([v, p]) => { setVendors(v); setParts(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToManifest = (part) => {
    if (manifest.find(i => i.partId === part.id)) return;
    setManifest([...manifest, { partId: part.id, name: part.name, sku: part.sku, quantity: 1, unitCost: part.price || 0 }]);
  };

  const updateManifest = (partId, field, value) =>
    setManifest(manifest.map(i => i.partId === partId ? { ...i, [field]: Math.max(1, parseInt(value) || 1) } : i));

  const removeFromManifest = (partId) => setManifest(manifest.filter(i => i.partId !== partId));

  const total = manifest.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const handleSubmit = async () => {
    if (!selectedVendor || !manifest.length) return;
    setSubmitting(true);
    try {
      await api.post('/purchases', { vendorId: parseInt(selectedVendor), items: manifest });
      setSuccess(true); setManifest([]); setSelectedVendor('');
      setTimeout(() => setSuccess(false), 4000);
    } catch { alert('Failed to record inventory refill.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading inventory data...</p>
    </div>
  );

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Replenishment</h1>
          <p className="text-sm text-slate-500 mt-1">Create purchase orders and synchronize stock with suppliers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[{ id: 'create', label: 'Create Order', icon: ClipboardList }, { id: 'history', label: 'Audit History', icon: History }].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Create Order View */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Source & Parts */}
          <div className="space-y-4">
            {/* Step 1: Select Vendor */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Source Supplier
              </h3>
              <div className="relative">
                <select
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-green-500 appearance-none cursor-pointer"
                >
                  <option value="">Browse Supplier Network</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Step 2: Select Parts */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Select Components
              </h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search full inventory catalog..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredParts.map(part => {
                  const inManifest = manifest.some(i => i.partId === part.id);
                  return (
                    <div key={part.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-50 transition-all">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{part.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{part.category} · {part.stockLevel} in stock</p>
                      </div>
                      <button
                        onClick={() => addToManifest(part)}
                        disabled={inManifest}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${inManifest ? 'text-green-600 bg-green-50 border border-green-200 cursor-not-allowed' : 'text-white bg-green-600 hover:bg-green-700'}`}
                      >
                        {inManifest ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="bg-white rounded-lg border border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Order Summary</h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Draft</span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {manifest.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
                  <Package className="w-10 h-10 text-slate-200" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">No parts selected</p>
                    <p className="text-xs text-slate-400 mt-0.5">Choose a vendor and add parts to begin</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {manifest.map(item => (
                    <div key={item.partId} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">${item.unitCost.toFixed(2)} / unit</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateManifest(item.partId, 'quantity', item.quantity - 1)} className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-100 transition-colors">
                          <Minus className="w-3 h-3 text-slate-500" />
                        </button>
                        <span className="text-sm font-semibold text-slate-900 w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateManifest(item.partId, 'quantity', item.quantity + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-100 transition-colors">
                          <Plus className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-16 text-right">${(item.quantity * item.unitCost).toFixed(2)}</span>
                      <button onClick={() => removeFromManifest(item.partId)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Valuation</span>
                <span className="font-bold text-slate-900">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!selectedVendor || !manifest.length || submitting}
                className="w-full py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Record Inventory Refill
              </button>
              <p className="text-xs text-slate-400 text-center">By confirming, stock will be updated in the database.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && <PurchaseHistory />}


      {/* Success toast */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 animate-fade-in">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Inventory Updated</p>
            <p className="text-xs text-slate-500">Stock refill recorded successfully</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockRefill;
