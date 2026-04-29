import React, { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MapPin, Edit2, Trash2, Globe, Search, RefreshCw, ShieldCheck, X, CheckCircle } from 'lucide-react';
import api from '../api/api';
import { useConfirmation } from '../context/ConfirmationContext';

const EMPTY_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '' };

const Vendors = () => {
  const [vendors, setVendors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const { confirm }                   = useConfirmation();

  const fetchVendors = () => {
    setLoading(true);
    api.get('/vendors').then(r => setVendors(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); };
  const openEdit = (vendor, e) => {
    e.stopPropagation();
    setForm({ name: vendor.name, contactPerson: vendor.contactPerson, phone: vendor.phone, email: vendor.email, address: vendor.address });
    setEditTarget(vendor);
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/vendors/${editTarget.id}`, { ...form, id: editTarget.id });
        showToast('Vendor updated successfully');
      } else {
        await api.post('/vendors', form);
        showToast('Vendor added to network');
      }
      setShowModal(false);
      fetchVendors();
    } catch { showToast('Operation failed. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Remove Supplier?',
      message: `Are you sure you want to remove "${name}" from your supplier network?`,
      confirmText: 'Remove',
      type: 'danger'
    });

    if (!isConfirmed) return;
    try {
      await api.delete(`/vendors/${id}`);
      setVendors(vendors.filter(v => v.id !== id));
      showToast('Vendor removed');
    } catch { showToast('Failed to delete vendor', 'error'); }
  };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
    v.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading suppliers...</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers Network</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your global parts supply chain and vendor partnerships</p>
        </div>
        <button onClick={openAdd} className="btn-green text-sm px-4 py-2 flex items-center gap-2 rounded-lg">
          <Plus className="w-4 h-4" /> Onboard New Vendor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg flex items-center gap-3 px-4">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input type="text" placeholder="Search suppliers by name, region or contact..."
          className="flex-1 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-lg">
            <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No suppliers found</p>
          </div>
        )}
        {filtered.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-0.5">{vendor.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                <Globe className="w-3.5 h-3.5" /> {vendor.contactPerson || 'Contact not listed'}
              </p>
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{vendor.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{vendor.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{vendor.address || 'Global Supplier'}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex items-center gap-2">
              <button onClick={e => openEdit(vendor, e)} className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2">
                <Edit2 className="w-3.5 h-3.5" /> Edit Details
              </button>
              <button onClick={e => handleDelete(vendor.id, vendor.name, e)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add new placeholder */}
        <button onClick={openAdd} className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-green-400 hover:bg-green-50 transition-all min-h-[220px] group">
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Expand Network</p>
            <p className="text-xs text-slate-400 mt-0.5">Connect with global suppliers</p>
          </div>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">{editTarget ? 'Edit Supplier' : 'Onboard New Supplier'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: 'Company Name *', key: 'name', placeholder: 'e.g. AutoZone Parts Ltd', required: true },
                { label: 'Contact Person', key: 'contactPerson', placeholder: 'e.g. John Smith' },
                { label: 'Phone', key: 'phone', placeholder: '+1 (555) 000-0000' },
                { label: 'Email', key: 'email', placeholder: 'contact@supplier.com', type: 'email' },
                { label: 'Address / Region', key: 'address', placeholder: 'e.g. New York, USA' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{field.label}</label>
                  <input
                    required={field.required} type={field.type || 'text'}
                    value={form[field.key]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-green-200 text-slate-800'}`}>
          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${toast.type === 'error' ? 'text-red-500' : 'text-green-600'}`} />
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}
    </div>
  );
};

export default Vendors;
