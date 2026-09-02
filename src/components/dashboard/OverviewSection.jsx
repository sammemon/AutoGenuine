// Overview: Rich, modern e-commerce dashboard with live store metrics,
// visual revenue analytics, fulfillment status pipeline, low stock inventory alerts,
// top selling OEM parts, payment distribution, and quick staff actions.
import { useEffect, useState } from 'react'
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  FolderTree,
  Car,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowUpRight,
  CreditCard,
  Building2,
  Wallet,
  PhoneCall,
  Flame,
  Boxes,
  Sparkles,
  ChevronRight,
  Smartphone,
} from 'lucide-react'
import { admin as adminAPI, aiStoreManager as aiAPI } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import { StatCard, DataState, TableWrap, Th, Td, Pill } from './ui'
import { ORDER_TONES } from './orderMeta'

export default function OverviewSection({ setSection }) {
  const { formatPrice } = useLocale()
  const { whatsappNumber, whatsappDisplay } = useStoreSettings()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [aiInsights, setAiInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadOverview(silent = false) {
    if (!silent) setLoading(true)
    Promise.all([
      adminAPI.stats(),
      adminAPI.listOrders(),
      aiAPI.getInsights().catch(() => null),
    ])
      .then(([s, o, ai]) => {
        setStats(s)
        setOrders(o)
        if (ai) setAiInsights(ai)
      })
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => {
    loadOverview()
  }, [])

  // Listen for real-time Socket.io events
  useEffect(() => {
    function handleLiveOrderEvent() {
      loadOverview(true) // silent background update
    }
    window.addEventListener('autogenuine_order_event', handleLiveOrderEvent)
    return () => window.removeEventListener('autogenuine_order_event', handleLiveOrderEvent)
  }, [])

  // Calculate highest revenue month for chart scaling
  const maxMonthlyRevenue = Math.max(...(stats?.monthlyTrend?.map((m) => m.revenue) || [100000]), 10000)

  return (
    <DataState loading={loading} error={error}>
      {stats && (
        <div className="space-y-6">
          {/* ================= 1. PRIMARY METRICS (HEADLINE STATS) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              accent="green"
              label="Total Revenue"
              value={formatPrice(stats.revenue)}
              hint="All non-cancelled orders"
            />
            <StatCard
              icon={TrendingUp}
              accent="brand"
              label="Today's Sales"
              value={formatPrice(stats.todayRevenue || 0)}
              hint={`${stats.todayOrders || 0} orders today`}
            />
            <StatCard
              icon={ShoppingBag}
              accent="amber"
              label="Total Orders"
              value={stats.orders}
              hint={`Avg order value: ${formatPrice(stats.avgOrderValue || 0)}`}
            />
            <StatCard
              icon={Users}
              accent="ink"
              label="Registered Customers"
              value={stats.users}
              hint={`${stats.admins} staff accounts`}
            />
          </div>

          {/* ================= 1.5. AI BUSINESS INSIGHTS BANNER ================= */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-5 text-white shadow-xl border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                      AI Executive Store Insights
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                      Live Analysis
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Automated sales intelligence, stock bottleneck alerts, and actionable recommendations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSection('ai-manager')}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <span>Launch AI Store Manager</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Live Insight Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {aiInsights?.insights?.slice(0, 3).map((insight, idx) => (
                <div
                  key={idx}
                  onClick={() => setSection('ai-manager')}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-xs transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                      {insight.icon === 'TrendingUp' && <TrendingUp size={13} />}
                      {insight.icon === 'TrendingDown' && <TrendingDown size={13} />}
                      {insight.icon === 'AlertTriangle' && <AlertTriangle size={13} className="text-amber-400" />}
                      {insight.icon === 'ShoppingBag' && <ShoppingBag size={13} className="text-orange-400" />}
                      {insight.icon === 'Sparkles' && <Sparkles size={13} className="text-amber-300" />}
                      <span>{insight.title}</span>
                    </span>
                    <ChevronRight size={14} className="text-white/40 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">{insight.description}</p>
                </div>
              )) || (
                <div className="col-span-3 p-3 text-center text-xs text-slate-300">
                  Analyzing store database performance metrics...
                </div>
              )}
            </div>
          </div>

          {/* ================= 2. QUICK ACTIONS BAR ================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold text-xs shadow-2xs">
                ⚡
              </span>
              <div>
                <p className="text-slate-900 font-bold text-xs">Quick Management Hub</p>
                <p className="text-slate-500 text-[11px]">Instant shortcuts for catalog & order operations</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {setSection && (
                <>
                  <button
                    onClick={() => setSection('products', { autoCreate: true })}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold hover:from-orange-600 hover:to-amber-700 transition-all shadow-2xs"
                  >
                    <Plus size={13} /> Add Product
                  </button>
                  <button
                    onClick={() => setSection('vehicles', { autoCreate: true })}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Plus size={13} /> Add Vehicle
                  </button>
                  <button
                    onClick={() => setSection('categories', { autoCreate: true })}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Plus size={13} /> Add Category
                  </button>
                  <button
                    onClick={() => setSection('orders', { filter: 'processing' })}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    <Clock size={13} /> Manage Orders ({stats.ordersByStatus?.processing || 0})
                  </button>
                </>
              )}
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <PhoneCall size={13} /> WhatsApp Desk ({whatsappDisplay})
              </a>
            </div>
          </div>

          {/* ================= 3. ORDER FULFILLMENT PIPELINE CARDS ================= */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-black text-xs uppercase tracking-wider">Order Fulfillment Pipeline</h3>
              <span className="text-xs text-slate-500 font-medium">{stats.orders} Total Orders</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Processing */}
              <div
                onClick={() => setSection && setSection('orders', { filter: 'processing' })}
                className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-4 cursor-pointer hover:bg-amber-100/70 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider group-hover:underline">Needs Packing</span>
                  <Clock size={16} className="text-amber-600" />
                </div>
                <p className="text-2xl font-black text-amber-900 mt-2">
                  {stats.ordersByStatus?.processing || 0}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">Click to view processing orders →</p>
              </div>

              {/* Shipped */}
              <div
                onClick={() => setSection && setSection('orders', { filter: 'shipped' })}
                className="bg-blue-50/60 border border-blue-200/90 rounded-2xl p-4 cursor-pointer hover:bg-blue-100/70 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider group-hover:underline">In Transit</span>
                  <Truck size={16} className="text-blue-600" />
                </div>
                <p className="text-2xl font-black text-blue-900 mt-2">
                  {stats.ordersByStatus?.shipped || 0}
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">Click to view in-transit orders →</p>
              </div>

              {/* Delivered */}
              <div
                onClick={() => setSection && setSection('orders', { filter: 'delivered' })}
                className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 cursor-pointer hover:bg-emerald-100/70 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:underline">Delivered</span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-900 mt-2">
                  {stats.ordersByStatus?.delivered || 0}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Click to view delivered orders →</p>
              </div>

              {/* Cancelled */}
              <div
                onClick={() => setSection && setSection('orders', { filter: 'cancelled' })}
                className="bg-red-50/60 border border-red-200/90 rounded-2xl p-4 cursor-pointer hover:bg-red-100/70 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wider group-hover:underline">Cancelled</span>
                  <XCircle size={16} className="text-red-600" />
                </div>
                <p className="text-2xl font-black text-red-900 mt-2">
                  {stats.ordersByStatus?.cancelled || 0}
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">Click to view cancelled orders →</p>
              </div>
            </div>
          </div>

          {/* ================= 4. REVENUE TREND CHART & LOW STOCK ALERTS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6-Month Sales Trend Visualizer */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-600" /> 6-Month Revenue & Sales Growth
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Live store monthly fulfillment volume</p>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-lg">
                  Active
                </span>
              </div>

              {/* Visual Bars */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
                {stats.monthlyTrend?.map((m, idx) => {
                  const heightPercent = Math.max(Math.round((m.revenue / maxMonthlyRevenue) * 100), 8)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {formatPrice(m.revenue)} ({m.orders} orders)
                      </div>

                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl relative flex items-end justify-center overflow-hidden h-32">
                        <div
                          className="w-full bg-gradient-to-t from-orange-600 to-amber-500 rounded-t-xl transition-all duration-500 group-hover:from-orange-700 group-hover:to-orange-500"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase text-center">
                        {m.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
                <span>Monthly Store Performance</span>
                <span className="font-bold text-slate-900">Total Revenue: {formatPrice(stats.revenue)}</span>
              </div>
            </div>

            {/* Low Stock Inventory Alert */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    ≤ 5 Units
                  </span>
                </div>
                <p className="text-slate-500 text-xs mb-3">Items requiring replenishment from suppliers</p>

                {stats.lowStockParts?.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                    All parts have healthy inventory levels.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {stats.lowStockParts?.slice(0, 4).map((p) => (
                      <div
                        key={p.slug}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/90 text-xs shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate text-[13px]">{p.name}</p>
                          <p className="text-slate-500 text-[11px]">{formatPrice(p.price)}</p>
                        </div>
                        <span className="font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg text-xs shrink-0">
                          {p.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {setSection && (
                <button
                  onClick={() => setSection('products')}
                  className="w-full mt-4 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Boxes size={13} /> View All Inventory
                </button>
              )}
            </div>
          </div>

          {/* ================= 5. TOP SELLING PARTS & PAYMENT METHODS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Selling Parts */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Flame size={16} className="text-red-500" /> Best Selling Genuine OEM Parts
                </h3>
                <span className="text-xs text-slate-500">Ranked by volume</span>
              </div>

              {stats.topSellingParts?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No sales data recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.topSellingParts?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-sm">{item.name}</p>
                          <p className="text-slate-500 text-[11px]">{item.unitsSold} units sold</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-sm shrink-0 ml-3">
                        {formatPrice(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                <CreditCard size={16} className="text-orange-600" /> Payment Channels
              </h3>
              <p className="text-slate-500 text-xs mb-4">Volume by payment gateway</p>

              <div className="space-y-3">
                {(() => {
                  const map = {
                    card: { key: 'card', label: 'Credit / Debit Card (Stripe 3DS)', count: 0, total: 0, Icon: CreditCard, color: 'text-blue-600' },
                    cod: { key: 'cod', label: 'Cash on Delivery (COD)', count: 0, total: 0, Icon: Wallet, color: 'text-amber-600' },
                    whatsapp: { key: 'whatsapp', label: 'WhatsApp Direct Order', count: 0, total: 0, Icon: PhoneCall, color: 'text-emerald-600' },
                    bank_transfer: { key: 'bank_transfer', label: 'Direct Bank Transfer', count: 0, total: 0, Icon: Building2, color: 'text-purple-600' },
                    wallet: { key: 'wallet', label: 'Digital Wallets', count: 0, total: 0, Icon: Smartphone, color: 'text-orange-600' },
                  }

                  ;(stats.paymentMethods || []).forEach((pm) => {
                    let key = 'cod'
                    const raw = String(pm._id || '').toLowerCase()
                    if (raw === 'card' || raw === 'stripe') key = 'card'
                    else if (raw === 'bank_transfer' || raw === 'bank') key = 'bank_transfer'
                    else if (raw === 'whatsapp') key = 'whatsapp'
                    else if (['wallet', 'easypaisa', 'jazzcash', 'paystack'].includes(raw)) key = 'wallet'
                    else key = 'cod'

                    if (map[key]) {
                      map[key].count += pm.count || 0
                      map[key].total += pm.total || 0
                    }
                  })

                  const activeChannels = Object.values(map).filter((item) => item.count > 0)

                  if (activeChannels.length === 0) {
                    return <p className="text-slate-400 text-xs text-center py-4">No order volume recorded yet.</p>
                  }

                  return activeChannels.map((item, idx) => {
                    const { Icon, color, label, count, total } = item
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className={color} />
                          <div>
                            <p className="font-bold text-slate-900">{label}</p>
                            <p className="text-slate-500 text-[11px]">{count} order{count === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 text-[13px]">{formatPrice(total)}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>

          {/* ================= 6. CATALOG ASSET SUMMARY ================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Active Products" value={stats.parts} hint="In store catalog" accent="blue" />
            <StatCard icon={FolderTree} label="Categories" value={stats.categories} hint="Storefront groups" accent="green" />
            <StatCard icon={Car} label="Supported Vehicles" value={stats.vehicles} hint="Toyota, Honda, etc." accent="brand" />
            <StatCard icon={MessageSquare} label="Inquiries" value={stats.messages} hint="Customer messages" accent="amber" />
          </div>

          {/* ================= 7. RECENT ORDERS LIVE TABLE ================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider">Recent Orders Feed</h3>
                <p className="text-slate-500 text-xs mt-0.5">Latest customer transactions</p>
              </div>
              {setSection && (
                <button
                  onClick={() => setSection('orders')}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  View All Orders <ArrowUpRight size={13} />
                </button>
              )}
            </div>

            <DataState loading={false} empty={orders.length === 0} emptyLabel="No orders placed yet">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Order Ref</Th>
                    <Th>Customer</Th>
                    <Th>Contact / Location</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((o) => {
                    const tone = ORDER_TONES[o.status] || 'ink'
                    return (
                      <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                        <Td className="font-black text-slate-900 text-xs">
                          ORD-{String(o._id).slice(-6).toUpperCase()}
                        </Td>
                        <Td className="font-bold text-slate-900 text-xs">
                          {o.customerName || o.user?.name || 'Customer'}
                        </Td>
                        <Td className="text-slate-500 text-xs">
                          {o.customerPhone || o.user?.phone || o.city || '—'}
                        </Td>
                        <Td className="text-slate-500 text-xs">
                          {o.items?.length || 0} items
                        </Td>
                        <Td className="font-black text-slate-900 text-xs whitespace-nowrap">
                          {formatPrice(o.total)}
                        </Td>
                        <Td>
                          <Pill tone={tone}>{o.status?.toUpperCase()}</Pill>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </TableWrap>
            </DataState>
          </div>
        </div>
      )}
    </DataState>
  )
}
