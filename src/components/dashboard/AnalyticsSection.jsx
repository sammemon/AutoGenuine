// Analytics (owner-only). Every number is a live aggregate from /admin/analytics
// — revenue, 6-month trend, top sellers, revenue by category. Charts are pure
// CSS bars so there's no external dependency.
import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Receipt, TrendingUp } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { StatCard, SectionHeader, DataState, TableWrap, Th, Td, Pill } from './ui'
import { ORDER_TONES } from './orderMeta'

export default function AnalyticsSection() {
  const { formatPrice } = useLocale()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminAPI.analytics()
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  const maxMonthly = data ? Math.max(1, ...data.monthly.map((m) => m.revenue)) : 1
  const maxCat = data ? Math.max(1, ...data.byCategory.map((c) => c.revenue)) : 1

  return (
    <>
      <SectionHeader title="Analytics" subtitle="Revenue and sales performance — visible to the Store Owner only." />

      <DataState loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} accent="green" label="Total Revenue" value={formatPrice(data.revenue)} hint="All non-cancelled orders" />
              <StatCard icon={ShoppingBag} accent="brand" label="Paid Orders" value={data.paidOrders} hint={`${data.totalOrders} placed total`} />
              <StatCard icon={Receipt} accent="ink" label="Avg Order Value" value={formatPrice(data.avgOrderValue)} hint="Revenue ÷ paid orders" />
              <StatCard icon={TrendingUp} accent="amber" label="Delivered" value={data.statusBreakdown?.delivered || 0} hint="Completed fulfilments" />
            </div>

            {/* Monthly revenue trend */}
            <div className="mt-6 bg-white rounded-xl border border-line p-5">
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="text-ink font-black text-[15px]">Revenue — last 6 months</h3>
                <span className="text-[11px] text-muted">peak {formatPrice(maxMonthly)}</span>
              </div>
              <div className="relative h-56 pl-1">
                {/* Horizontal gridlines (4 bands) sit behind the bars */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-dashed border-line/70 w-full" />
                  ))}
                </div>
                {/* Bars */}
                <div className="relative flex items-end gap-2 sm:gap-4 h-full">
                  {data.monthly.map((m) => {
                    const pct = maxMonthly > 0 ? (m.revenue / maxMonthly) * 100 : 0
                    return (
                      <div key={m.label} className="flex-1 flex flex-col items-center h-full min-w-0 group">
                        <div className="relative w-full flex-1 flex items-end justify-center">
                          {/* value label floats above the bar */}
                          {m.revenue > 0 && (
                            <span className="absolute -top-0 text-[10px] font-bold text-ink whitespace-nowrap">{formatPrice(m.revenue)}</span>
                          )}
                          <div
                            className="w-full max-w-[46px] bg-gradient-to-t from-brand to-brand-600 rounded-t-md transition-all group-hover:opacity-90"
                            style={{ height: m.revenue > 0 ? `${Math.max(6, pct)}%` : '2px' }}
                            title={`${m.label} · ${m.orders} order${m.orders === 1 ? '' : 's'} · ${formatPrice(m.revenue)}`}
                          />
                        </div>
                        <span className="mt-2 text-[11px] font-semibold text-muted">{m.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top sellers */}
              <div>
                <h3 className="text-ink font-black text-[15px] mb-4">Top sellers</h3>
                <DataState loading={false} empty={data.topProducts.length === 0} emptyLabel="No sales yet">
                  <TableWrap>
                    <thead><tr><Th>Product</Th><Th>Units</Th><Th>Revenue</Th></tr></thead>
                    <tbody>
                      {data.topProducts.map((p) => (
                        <tr key={p.slug}>
                          <Td className="font-semibold text-ink">{p.name}</Td>
                          <Td><Pill tone="brand">{p.units}</Pill></Td>
                          <Td className="font-semibold text-ink whitespace-nowrap">{formatPrice(p.revenue)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </DataState>
              </div>

              {/* Revenue by category */}
              <div>
                <h3 className="text-ink font-black text-[15px] mb-4">Revenue by category</h3>
                {data.byCategory.length === 0 ? (
                  <p className="text-muted text-[13px]">No sales yet.</p>
                ) : (
                  <div className="bg-white rounded-xl border border-line p-5 space-y-4">
                    {data.byCategory.map((c) => (
                      <div key={c.category}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="font-semibold text-ink capitalize">{c.category}</span>
                          <span className="text-muted">{formatPrice(c.revenue)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${(c.revenue / maxCat) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DataState>
    </>
  )
}
