import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, UserPlus, Phone, Mail, Car,
  ChevronRight, RefreshCw, ArrowUpDown, X, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [searchType, setSearchType] = useState('name');
  const [searching, setSearching]   = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);
  const [form, setForm]             = useState({
    fullName: '', email: '', phone: '', address: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = () => {
    setLoading(true);
    api.get('/customers').then(r => setCustomers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // AA-10: multi-type search via backend
  const handleSearch = useCallback(async (q, type) => {
    if (!q.trim()) { fetchAll(); return; }
    setSearching(true);
    try {
      const res = await api.get('/customers/search', { params: { q, type } });
      setCustomers(res.data);
    } catch { console.error('Search failed'); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(search, searchType), 400);
    return () => clearTimeout(timer);
  }, [search, searchType, handleSearch]);

  // AA-6: Register new customer
  const handleRegister = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/customers', form);
      showToast(`${form.fullName} registered successfully`);
      setShowModal(false);
      setForm({ fullName: '', email: '', phone: '', address: '' });
      fetchAll();
    } catch {
      showToast('Failed to register customer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Retrieving customer records...</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your customer base and service history</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-green text-sm px-4 py-2 flex items-center gap-2 rounded-lg"
        >
          <UserPlus className="w-4 h-4" /> Register New Customer
        </button>
      </div>

      {/* Search bar — AA-10: name / phone / ID / plate */}
      <div className="bg-white border border-slate-200 rounded-lg flex items-center gap-0 overflow-hidden">
        <select
          value={searchType}
          onChange={e => { setSearchType(e.target.value); if (search) handleSearch(search, e.target.value); }}
          className="text-xs font-semibold text-slate-600 bg-slate-50 border-r border-slate-200 px-3 py-3 outline-none cursor-pointer"
        >
          <option value="name">Name</option>
          <option value="phone">Phone</option>
          <option value="id">Customer ID</option>
          <option value="plate">License Plate</option>
        </select>
        <div className="flex items-center flex-1 px-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2" />
          <input
            type="text"
            placeholder={`Search across ${searchType}...`}
            className="flex-1 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {searching && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />}
        </div>
        <div className="w-px h-5 bg-slate-200"></div>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 font-medium py-3 px-4 hover:text-green-600 transition-colors">
          <ArrowUpDown className="w-4 h-4" /> Sort
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicles</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Since</th>
              <th className="py-3 px-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-16 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No customer profiles found</p>
                </td>
              </tr>
            ) : customers.map(c => (
              <tr
                key={c.id}
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => navigate(`/customers/${c.id}`)}
              >
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {c.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <p className="font-medium text-slate-900">{c.fullName}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5" /> {c.phone || '—'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5" /> {c.email || '—'}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    {c.vehicles?.length > 0
                      ? c.vehicles.slice(0,2).map((v, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            <Car className="w-3 h-3" /> {v.licensePlate}
                          </span>
                        ))
                      : <span className="text-xs text-slate-400">No vehicles</span>
                    }
                    {c.vehicles?.length > 2 && <span className="text-xs text-slate-400">+{c.vehicles.length - 2} more</span>}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-5">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-green-600 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">{customers.length} customers found</p>
        </div>
      </div>

      {/* ── Register Customer Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                <h3 className="text-base font-bold text-slate-900">Register New Customer</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="e.g. Ram Bahadur Thapa"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="+977-98XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
                <input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="e.g. Kathmandu, Nepal"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in border ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-green-200 text-slate-800'
        }`}>
          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${toast.type === 'error' ? 'text-red-500' : 'text-green-600'}`} />
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}
    </div>
  );
};

export default Customers;
