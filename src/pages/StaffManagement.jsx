import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, RefreshCw, ShieldCheck, Shield, User, Search, X, CheckCircle } from 'lucide-react';
import api from '../api/api';
import { useConfirmation } from '../context/ConfirmationContext';

const roleConfig = {
  Admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: ShieldCheck },
  Staff: { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Shield },
  Customer: { bg: 'bg-slate-100', text: 'text-slate-600', icon: User },
};

const StaffManagement = () => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState(null);
  const [form, setForm]           = useState({ fullName: '', email: '', password: '', role: 'Staff' });
  const [submitting, setSubmitting] = useState(false);
  const { confirm } = useConfirmation();

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/create-staff', form);
      showToast('Staff account created successfully');
      setShowModal(false);
      setForm({ fullName: '', email: '', password: '', role: 'Staff' });
      fetchUsers();
    } catch { showToast('Failed to create account', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleRoleChange = async (id, newRole, userName) => {
    const isConfirmed = await confirm({
      title: 'Change User Role?',
      message: `Are you sure you want to change ${userName}'s role to ${newRole}?`,
      confirmText: 'Change Role',
      type: 'warning'
    });

    if (!isConfirmed) return;

    try {
      await api.put(`/users/${id}/role`, JSON.stringify(newRole), { headers: { 'Content-Type': 'application/json' } });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      showToast('Role updated');
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Remove Staff Account?',
      message: `Are you sure you want to remove ${name} from the system? This will revoke all access.`,
      confirmText: 'Remove Account',
      type: 'danger'
    });

    if (!isConfirmed) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      showToast('Account removed');
    } catch { showToast('Failed to delete account', 'error'); }
  };

  const filtered = users.filter(u =>
    u.role !== 'Customer' && (
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading staff accounts...</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user accounts, roles and access permissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-green text-sm px-4 py-2 flex items-center gap-2 rounded-lg">
          <Plus className="w-4 h-4" /> Add Staff Account
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-lg flex items-center gap-3 px-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Search by name or email..."
          className="flex-1 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Member</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
              <th className="py-3 px-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="py-16 text-center">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No staff accounts found</p>
              </td></tr>
            ) : filtered.map(user => {
              const rc = roleConfig[user.role] || roleConfig.Staff;
              const Icon = rc.icon;
              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.fullName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <p className="font-medium text-slate-900">{user.fullName}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${rc.bg} ${rc.text}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.role !== 'Admin' && (
                        <button 
                          onClick={() => handleRoleChange(user.id, user.role === 'Staff' ? 'Customer' : 'Staff', user.fullName)} 
                          className="text-xs font-bold px-2.5 py-1 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors mr-2"
                        >
                          Make {user.role === 'Staff' ? 'Customer' : 'Staff'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(user.id, user.fullName)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">{filtered.length} accounts found</p>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create Staff Account</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="e.g. John Smith" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="john@autoparts.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                  placeholder="Minimum 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 transition-colors bg-white">
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Account'}
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

export default StaffManagement;
