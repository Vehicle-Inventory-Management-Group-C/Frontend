import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, Users,
  RefreshCw, BarChart3, ArrowUpRight, ChevronRight,
  Crown, Star, AlertCircle, Calendar, Tag, Download
} from 'lucide-react';
import api from '../api/api';

const Reports = () => {
  const [revenue, setRevenue]         = useState(null);
  const [topParts, setTopParts]       = useState([]);
  const [stockVal, setStockVal]       = useState(null);
  const [topSpenders, setTopSpenders] = useState([]);
  const [regulars, setRegulars]       = useState([]);
  const [overdue, setOverdue]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('financial');
  const [exporting, setExporting]     = useState(false);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    setExporting(true);
    let rows = [];
    let filename = '';

    if (activeTab === 'financial') {
      filename = 'revenue_report.csv';
      rows = [
        ['Period', 'Revenue (NPR)'],
        ['Today', revenue?.dailyRevenue?.toFixed(2) || '0.00'],
        ['This Month', revenue?.monthlyRevenue?.toFixed(2) || '0.00'],
        ['This Year', revenue?.yearlyRevenue?.toFixed(2) || '0.00'],
        [],
        ['Month', 'Year', 'Revenue', 'Orders'],
        ...(revenue?.monthlyBreakdown || []).map(m => [
          new Date(m.year, m.month - 1).toLocaleString('default', { month: 'long' }),
          m.year, m.revenue?.toFixed(2), m.count
        ]),
        [],
        ['Top Selling Parts'],
        ['Part Name', 'Units Sold', 'Revenue'],
        ...topParts.map(p => [p.partName, p.totalSold, p.revenue?.toFixed(2)]),
      ];
    } else if (activeTab === 'spenders') {
      filename = 'top_spenders.csv';
      rows = [
        ['Rank', 'Customer Name', 'Email', 'Phone', 'Total Orders', 'Total Spend (NPR)'],
        ...topSpenders.map((s, i) => [i + 1, s.customerName, s.email, s.phone, s.totalOrders, s.totalSpend?.toFixed(2)]),
      ];
    } else if (activeTab === 'regulars') {
      filename = 'regular_customers.csv';
      rows = [
        ['Customer Name', 'Email', 'Phone', 'Total Orders', 'Total Spend (NPR)', 'Last Visit'],
        ...regulars.map(r => [r.customerName, r.email, r.phone, r.totalOrders, r.totalSpend?.toFixed(2), new Date(r.lastVisit).toLocaleDateString()]),
      ];
    } else if (activeTab === 'overdue') {
      filename = 'overdue_credit.csv';
      rows = [
        ['Customer Name', 'Email', 'Phone', 'Oldest Invoice Date', 'Total Amount (NPR)'],
        ...overdue.map(o => [o.customerName, o.email, o.phone, new Date(o.oldestInvoice).toLocaleDateString(), o.totalAmount?.toFixed(2)]),
      ];
    }

    const csv = rows.map(r => r.map(cell => `"${cell ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  };

  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue-summary'),
      api.get('/reports/top-parts'),
      api.get('/reports/stock-valuation'),
      api.get('/reports/customers/top-spenders'),
      api.get('/reports/customers/regulars'),
      api.get('/reports/customers/overdue-credit'),
    ]).then(([rev, parts, stock, spenders, regs, od]) => {
      setRevenue(rev.data);
      setTopParts(parts.data);
      setStockVal(stock.data);
      setTopSpenders(spenders.data);
      setRegulars(regs.data);
      setOverdue(od.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Compiling reports...</p>
    </div>
  );

  const tabs = [
    { id: 'financial',  label: 'Financial',        icon: TrendingUp },
    { id: 'spenders',   label: 'Top Spenders',      icon: Crown },
    { id: 'regulars',   label: 'Regular Customers', icon: Star },
    { id: 'overdue',    label: 'Overdue Credit',    icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Business intelligence and performance insights</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="btn-green text-sm px-4 py-2 flex items-center gap-2 rounded-lg disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Daily Revenue',    value: `NPR ${revenue?.dailyRevenue?.toFixed(2) || '0.00'}`,   icon: DollarSign, color: 'bg-green-600' },
          { title: 'Monthly Revenue',  value: `NPR ${revenue?.monthlyRevenue?.toFixed(2) || '0.00'}`, icon: Calendar,   color: 'bg-blue-600' },
          { title: 'Yearly Revenue',   value: `NPR ${revenue?.yearlyRevenue?.toFixed(2) || '0.00'}`,  icon: TrendingUp, color: 'bg-teal-600' },
          { title: 'Stock Valuation',  value: `NPR ${stockVal?.totalValuation?.toFixed(2) || '0.00'}`,icon: Package,    color: 'bg-purple-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
                </div>
                <div className={`${card.color} rounded-lg p-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600 bg-green-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ── Financial Tab ── */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Monthly bar chart */}
              {revenue?.monthlyBreakdown?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    Revenue Trend — Last 12 Months
                  </h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    {/* Bar chart */}
                    <div className="flex items-end gap-1.5 h-40">
                      {(() => {
                        const maxRev = Math.max(...revenue.monthlyBreakdown.map(m => m.revenue), 1);
                        return revenue.monthlyBreakdown.map((m, i) => {
                          const pct    = (m.revenue / maxRev) * 100;
                          const month  = new Date(m.year, m.month - 1).toLocaleString('default', { month: 'short' });
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                NPR {m.revenue.toFixed(0)}
                              </div>
                              <div
                                className="w-full bg-green-500 group-hover:bg-green-600 rounded-t transition-all"
                                style={{ height: `${Math.max(pct, 2)}%` }}
                              />
                              <span className="text-[9px] text-slate-400 font-medium">{month}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {/* Summary row */}
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                      <span>{revenue.monthlyBreakdown.length} months tracked</span>
                      <span className="font-semibold text-slate-700">
                        Total: NPR {revenue.monthlyBreakdown.reduce((s, m) => s + m.revenue, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}


              {/* Top selling parts */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top Selling Parts</h3>
                {topParts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No sales data available</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Part</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Units Sold</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {topParts.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                              <span className="font-medium text-slate-900">{p.partName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">{p.totalSold}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">NPR {p.revenue?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Top Spenders Tab (AA-9) ── */}
          {activeTab === 'spenders' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-bold text-slate-900">Top 10 Customers by Total Spend</h3>
              </div>
              {topSpenders.length === 0 ? (
                <div className="py-12 text-center">
                  <Crown className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No sales data yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rank</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                      <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topSpenders.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {c.customerName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{c.customerName}</p>
                              <p className="text-xs text-slate-400">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">{c.totalOrders}</td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">NPR {c.totalSpend?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Regular Customers Tab (AA-9) ── */}
          {activeTab === 'regulars' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900">Regular Customers (3+ Orders)</h3>
              </div>
              {regulars.length === 0 ? (
                <div className="py-12 text-center">
                  <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No regular customers found yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                      <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Orders</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spend</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {regulars.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {c.customerName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{c.customerName}</p>
                              <p className="text-xs text-slate-400">{c.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">{c.totalOrders} orders</span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">NPR {c.totalSpend?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-xs text-slate-400">
                          {new Date(c.lastVisit).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Overdue Credit Tab (AA-9) ── */}
          {activeTab === 'overdue' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-slate-900">Overdue Credit Customers (&gt;30 days)</h3>
                </div>
                {overdue.length > 0 && (
                  <button className="text-sm text-red-600 font-semibold border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                    Send Reminders
                  </button>
                )}
              </div>
              {overdue.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">All accounts are current</p>
                  <p className="text-xs text-slate-400 mt-1">No overdue credit balances found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Oldest Invoice</th>
                      <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Owed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {overdue.map((c, i) => (
                      <tr key={i} className="hover:bg-red-50/50">
                        <td className="py-3 px-4 font-medium text-slate-900">{c.customerName}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{c.email}<br />{c.phone}</td>
                        <td className="py-3 px-4 text-right text-xs text-red-600 font-medium">
                          {new Date(c.oldestInvoice).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-red-600">NPR {c.totalAmount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
