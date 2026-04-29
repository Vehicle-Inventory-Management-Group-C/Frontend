import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Settings as SettingsIcon, LogOut, Wrench, Search,
  Bell, TrendingUp, Calendar, UserCog, Truck, ClipboardList
} from 'lucide-react';
import './App.css';
import Dashboard      from './pages/Dashboard';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Landing        from './pages/Landing';
import { About, Contact, PrivacyPolicy, TermsOfService } from './pages/PublicPages';
import Inventory      from './pages/Inventory';
import Vendors        from './pages/Vendors';
import Customers      from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Sales          from './pages/Sales';
import StockRefill    from './pages/StockRefill';
import Reports        from './pages/Reports';
import Appointments   from './pages/Appointments';
import Settings       from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import PartRequests from './pages/PartRequests';
import ProtectedRoute from './components/ProtectedRoute';
import BrandLogo from './components/BrandLogo';
import NotificationBell from './components/NotificationBell';
import { getCurrentUser, logout } from './api/auth';

// ── Customer Portal ──────────────────────────────────────────────────────────
import CustomerLayout       from './pages/customer/CustomerLayout';
import CustomerPortal       from './pages/customer/CustomerPortal';
import CustomerProfile      from './pages/customer/CustomerProfile';
import CustomerAppointments from './pages/customer/CustomerAppointments';
import CustomerHistory      from './pages/customer/CustomerHistory';
import CustomerPartRequests from './pages/customer/CustomerPartRequests';

// ─────────────────────────────────────────────────────────────────────────────
// Admin-only sidebar paths
const ADMIN_ONLY_PATHS = ['/inventory', '/vendors', '/stock-refill', '/staff'];

const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard', type: 'S' },
  { icon: Package,         label: 'Inventory',    path: '/inventory', type: 'S' },
  { icon: Truck,           label: 'Vendors',      path: '/vendors', type: 'S' },
  { icon: Package,         label: 'Stock Refill', path: '/stock-refill', type: 'S' },
  { icon: Users,           label: 'Customers',    path: '/customers', type: 'C' },
  { icon: ShoppingCart,    label: 'Point of Sale',path: '/sales', type: 'C' },
  { icon: ClipboardList,   label: 'Part Requests',path: '/part-requests', type: 'C' },
  { icon: Calendar,        label: 'Appointments', path: '/appointments', type: 'C' },
  { icon: TrendingUp,      label: 'Reports',      path: '/reports', type: 'S' },
  { icon: UserCog,         label: 'Staff',        path: '/staff', type: 'S' },
  { icon: SettingsIcon,    label: 'Settings',     path: '/settings', type: 'S' },
];

// ─────────────────────────────────────────────────────────────────────────────
const MainLayout = ({ children }) => {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const isAdmin   = user?.role === 'Admin';

  const menuItems = isAdmin
    ? ALL_MENU_ITEMS
    : ALL_MENU_ITEMS.filter(i => !ADMIN_ONLY_PATHS.includes(i.path));

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => window.location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
            <BrandLogo className="h-8" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 -mt-1">
              {isAdmin ? 'Administrator' : 'Staff Panel'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isAdmin && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${active ? 'bg-green-500/30 text-green-50' : 'bg-slate-200 text-slate-500'}`}>
                    {item.type}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search parts, customers, invoices..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 ml-4">
            <NotificationBell />
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors"
            >
              {user?.profilePictureUrl ? (
                <img 
                  src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `http://127.0.0.1:5057${user.profilePictureUrl}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" 
                />
              ) : (
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  {(user?.fullName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-slate-700 leading-none">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wider">{user?.role || 'Administrator'}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const App = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/"        element={<Landing />} />
    <Route path="/about"   element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms"   element={<TermsOfService />} />
    <Route path="/login"   element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Customer Portal */}
    <Route path="/portal/*" element={
      <ProtectedRoute allowedRoles={['Customer']}>
        <CustomerLayout>
          <Routes>
            <Route path="dashboard"    element={<CustomerPortal />} />
            <Route path="profile"      element={<CustomerProfile />} />
            <Route path="appointments" element={<CustomerAppointments />} />
            <Route path="history"      element={<CustomerHistory />} />
            <Route path="requests"     element={<CustomerPartRequests />} />
            <Route path="*"            element={<Navigate to="dashboard" replace />} />
          </Routes>
        </CustomerLayout>
      </ProtectedRoute>
    } />

    {/* Admin + Staff Portal */}
    <Route path="/*" element={
      <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
        <MainLayout>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="settings"  element={<Settings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="sales"      element={<Sales />} />
            <Route path="reports"    element={<Reports />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="part-requests" element={<PartRequests />} />

            {/* Admin only */}
            <Route path="inventory"    element={<ProtectedRoute allowedRoles={['Admin']}><Inventory /></ProtectedRoute>} />
            <Route path="vendors"      element={<ProtectedRoute allowedRoles={['Admin']}><Vendors /></ProtectedRoute>} />
            <Route path="stock-refill" element={<ProtectedRoute allowedRoles={['Admin']}><StockRefill /></ProtectedRoute>} />
            <Route path="staff"        element={<ProtectedRoute allowedRoles={['Admin']}><StaffManagement /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </MainLayout>
      </ProtectedRoute>
    } />
  </Routes>
);

export default App;
