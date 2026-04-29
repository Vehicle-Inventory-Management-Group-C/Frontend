import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, User, Search, FileText,
  CheckCircle, CreditCard, Banknote, X, Package, Filter,
  RefreshCw, Tag, ChevronDown, AlertTriangle
} from 'lucide-react';
import { getParts } from '../api/partsService';
import { getCustomers } from '../api/customerService';
import { createSale } from '../api/salesService';

const Sales = () => {
  const [cart, setCart]               = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch]     = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [search, setSearch]           = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [parts, setParts]             = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [processing, setProcessing]   = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    Promise.all([getParts(), getCustomers()])
      .then(([p, c]) => { setParts(p); setCustomers(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (part) => {
    if (part.stockLevel <= 0) return;
    const existing = cart.find(i => i.id === part.id);
    if (existing) {
      if (existing.quantity >= part.stockLevel) return; // cap at stock
      setCart(cart.map(i => i.id === part.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...part, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => setCart(cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeItem = (id) => setCart(cart.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // AA-16: 10% loyalty discount when CURRENT purchase > 5000
  const discountApplies = subtotal > 5000;
  const discountAmount  = discountApplies ? subtotal * 0.1 : 0;
  const total           = subtotal - discountAmount;

  const handleCheckout = async () => {
    if (!cart.length || processing) return;
    setProcessing(true);
    try {
      const res = await createSale({
        customerId: selectedCustomer?.id || null,
        items: cart.map(i => ({ partId: i.id, quantity: i.quantity, unitPrice: i.price })),
        totalAmount: total,
        paymentMethod: paymentMethod
      });
      
      const invoiceId = res?.data?.id || `INV-${Date.now()}`;
      
      if (paymentMethod === 'eSewa') {
        // eSewa Integration Flow
        const uuid = `TXN-${invoiceId}-${Date.now()}`;
        const signatureRes = await api.post('/esewa/generate-signature', {
          total_amount: total.toFixed(2),
          transaction_uuid: uuid,
          product_code: 'EPAYTEST'
        });
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
        
        const fields = {
          amount: total.toFixed(2),
          tax_amount: '0',
          total_amount: total.toFixed(2),
          transaction_uuid: uuid,
          product_code: 'EPAYTEST',
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: `${window.location.origin}/sales?esewa=success&invoice=${invoiceId}`,
          failure_url: `${window.location.origin}/sales?esewa=failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature: signatureRes.data.signature
        };
        
        for (const key in fields) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return; // Stop here as we are redirecting
      }

      setLastInvoice({ id: invoiceId, total, discountApplied: discountApplies, customerName: selectedCustomer?.fullName });
      setShowSuccess(true);
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
    } catch { alert('Checkout failed. Please try again.'); }
    finally { setProcessing(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-slate-500">Initializing POS terminal...</p>
    </div>
  );

  const categories = ['All', ...new Set(parts.map(p => p.category).filter(Boolean))];
  const filtered = parts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredCustomers = customers.filter(c =>
    c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
        <p className="text-sm text-slate-500 mt-1">Process sales transactions and manage invoices</p>
      </div>

      <div className="flex gap-5 h-[calc(100vh-190px)]">
        {/* ── Left: Products ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Search & Filter bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg flex items-center gap-3 px-4">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text" placeholder="Search parts by name or category..."
                className="flex-1 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-green-500 cursor-pointer">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Parts Grid */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Package className="w-10 h-10 text-slate-200" />
                <p className="text-sm text-slate-400">No parts found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map(part => {
                  const inCart = cart.find(i => i.id === part.id);
                  const outOfStock = part.stockLevel <= 0;
                  return (
                    <div
                      key={part.id}
                      onClick={() => addToCart(part)}
                      className={`bg-white border rounded-lg p-4 transition-all group relative ${
                        outOfStock
                          ? 'border-slate-100 opacity-50 cursor-not-allowed'
                          : inCart
                          ? 'border-green-400 shadow-sm cursor-pointer'
                          : 'border-slate-200 hover:border-green-400 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${inCart ? 'bg-green-100' : 'bg-slate-100 group-hover:bg-green-50'}`}>
                          <Package className={`w-4 h-4 ${inCart ? 'text-green-600' : 'text-slate-400 group-hover:text-green-600'}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${outOfStock ? 'bg-red-100 text-red-600' : part.stockLevel < 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {outOfStock ? 'Out of Stock' : `${part.stockLevel} left`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-0.5">{part.category || 'General'}</p>
                      <p className="text-sm font-semibold text-slate-900 leading-tight mb-3">{part.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">NPR {part.price?.toFixed(2)}</span>
                        {!outOfStock && (
                          <div className="w-7 h-7 bg-green-600 text-white rounded-lg flex items-center justify-center text-lg font-bold leading-none">+</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart ── */}
        <div className="w-80 bg-white border border-slate-200 rounded-lg flex flex-col flex-shrink-0 overflow-hidden">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                Current Transaction
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors">Clear</button>
              )}
            </div>

            {/* Customer selector */}
            <div className="mt-3 relative">
              <button
                onClick={() => setShowCustomerList(!showCustomerList)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-green-400 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className={`flex-1 text-left truncate ${selectedCustomer ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {selectedCustomer ? selectedCustomer.fullName : 'Select customer...'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
              {showCustomerList && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg mt-1 z-10 shadow-lg">
                  <div className="p-2 border-b border-slate-100">
                    <input autoFocus type="text" placeholder="Search name or phone..."
                      className="w-full text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-green-400"
                      value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    <button onClick={() => { setSelectedCustomer(null); setShowCustomerList(false); setCustomerSearch(''); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 transition-colors">
                      — Walk-in customer
                    </button>
                    {filteredCustomers.slice(0,10).map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); setCustomerSearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                          {c.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-xs">{c.fullName}</p>
                          <p className="text-xs text-slate-400">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Cart is empty</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click parts to add them</p>
                </div>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">NPR {item.price?.toFixed(2)} ea.</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-slate-100 border border-slate-200 rounded flex items-center justify-center hover:bg-slate-200 transition-colors">
                    <Minus className="w-3 h-3 text-slate-500" />
                  </button>
                  <span className="text-sm font-bold text-slate-900 w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-slate-100 border border-slate-200 rounded flex items-center justify-center hover:bg-slate-200 transition-colors">
                    <Plus className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-900 w-24 text-right">NPR {(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary & Checkout */}
          <div className="px-5 py-4 border-t border-slate-200 space-y-4 bg-slate-50/60">

            {/* AA-16: Loyalty Discount Banner */}
            {discountApplies && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-800">Loyalty Discount Applied!</p>
                  <p className="text-xs text-green-700 mt-0.5">10% off — purchase exceeds $5,000</p>
                </div>
                <span className="text-sm font-bold text-green-600">-NPR {discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Approaching discount notice */}
            {!discountApplies && subtotal > 4000 && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <Tag className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  Add <span className="font-bold">NPR {(5000 - subtotal).toFixed(2)}</span> more for 10% loyalty discount
                </p>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>NPR {subtotal.toFixed(2)}</span>
              </div>
              {discountApplies && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Loyalty Discount (10%)</span>
                  <span>-NPR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-green-600">NPR {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod('eSewa')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium border rounded-lg transition-colors ${paymentMethod === 'eSewa' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <CreditCard className="w-3.5 h-3.5" /> eSewa
              </button>
              <button 
                onClick={() => setPaymentMethod('Cash')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium border rounded-lg transition-colors ${paymentMethod === 'Cash' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Banknote className="w-3.5 h-3.5" /> Cash
              </button>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!cart.length || processing}
              className="w-full py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                : <><FileText className="w-4 h-4" /> Complete Transaction</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sale Confirmed!</h3>
              {lastInvoice && (
                <div className="mt-3 text-left space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 border-b border-slate-100 pb-2">
                    <span>Invoice #</span>
                    <span className="font-semibold text-slate-900">{lastInvoice.id || '—'}</span>
                  </div>
                  {lastInvoice.customerName && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Customer</span>
                      <span className="font-medium text-slate-900">{lastInvoice.customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                    <span>Total Charged</span>
                    <span className="text-green-600">NPR {lastInvoice.total?.toFixed(2)}</span>
                  </div>
                  {lastInvoice.discountApplied && (
                    <div className="flex items-center gap-1.5 mt-2 bg-green-50 rounded-lg px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">10% Loyalty Discount Was Applied</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Print Receipt
              </button>
              <button
                onClick={() => { setShowSuccess(false); setLastInvoice(null); }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
