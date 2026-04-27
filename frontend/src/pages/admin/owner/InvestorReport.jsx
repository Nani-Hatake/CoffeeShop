import { useEffect, useState } from "react";

import AdminShell, { Section, StatCard } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";

export default function InvestorReport() {
  const [report, setReport] = useState(null);
  const [days, setDays] = useState(90);

  useEffect(() => {
    ownerApi.investor(days).then(setReport);
  }, [days]);

  const fmt = (v) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrint = () => window.print();

  return (
    <AdminShell
      title="Investor report"
      subtitle="Owner · Growth & sustainability"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last quarter</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={handlePrint}
            className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print / PDF
          </button>
        </div>
      }
    >
      {!report ? (
        <p className="text-on-surface-variant">Loading report…</p>
      ) : (
        <div className="space-y-6">
          {/* Cover */}
          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-container text-on-primary p-10 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-on-primary/5" />
            <p className="text-[11px] uppercase tracking-[0.4em] opacity-70">Artisan Brew</p>
            <h2 className="font-serif text-5xl mt-2 leading-tight">Investor briefing</h2>
            <p className="opacity-80 mt-3">
              {new Date(report.period_start).toLocaleDateString()} → {new Date(report.period_end).toLocaleDateString()}
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <Hero label="Revenue" value={fmt(report.revenue)} />
              <Hero label="Net profit" value={fmt(report.net_profit)}
                hint={`${report.net_margin_pct}% net margin`} />
              <Hero label="Customers" value={report.customer_count.toLocaleString()}
                hint={`+${report.new_customers} new`} />
            </div>
          </div>

          {/* CAC vs LTV */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard icon="campaign" label="CAC"
              value={fmt(report.cac)} delta="Marketing spend / new customer" />
            <StatCard icon="diamond" label="LTV"
              value={fmt(report.ltv)} delta="Lifetime average spend" accent="tertiary" />
            <StatCard icon="balance" label="LTV : CAC"
              value={`${report.cac_ltv_ratio}x`}
              delta={report.cac_ltv_ratio >= 3 ? "Healthy" : "Improve marketing efficiency"}
              accent={report.cac_ltv_ratio >= 3 ? "tertiary" : "warning"} />
            <StatCard icon="receipt_long" label="Avg order value"
              value={fmt(report.avg_order_value)} />
          </div>

          {/* Top products */}
          <Section title="Top products by revenue">
            {report.top_products.length === 0 ? (
              <p className="text-on-surface-variant text-center py-6">No paid orders in this period.</p>
            ) : (
              <ul className="space-y-3">
                {report.top_products.map((p, i) => {
                  const max = Math.max(1, ...report.top_products.map((t) => t.revenue));
                  return (
                    <li key={p.name}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium">
                          <span className="text-on-surface-variant mr-2">#{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="text-primary font-medium">{fmt(p.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(p.revenue / max) * 100}%` }} />
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{p.qty} sold</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Locations */}
          <Section title="Atelier performance">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="py-2">Location</th>
                  <th className="py-2 text-right">Revenue</th>
                  <th className="py-2 text-right">Orders</th>
                  <th className="py-2 text-right">AOV</th>
                  <th className="py-2 text-right">Labor %</th>
                </tr>
              </thead>
              <tbody>
                {report.locations.map((l) => (
                  <tr key={l.store_id || l.store_name} className="border-b border-outline-variant last:border-0">
                    <td className="py-2 font-medium">{l.store_name}</td>
                    <td className="py-2 text-right">{fmt(l.revenue)}</td>
                    <td className="py-2 text-right">{l.orders}</td>
                    <td className="py-2 text-right">{fmt(l.avg_order_value)}</td>
                    <td className="py-2 text-right">{l.labor_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant text-center pb-6">
            Confidential · Artisan Brew Coffee Co.
          </p>
        </div>
      )}

      <style>{`
        @media print {
          aside, header { display: none !important; }
          .lg\\:pl-64 { padding-left: 0 !important; }
        }
      `}</style>
    </AdminShell>
  );
}

function Hero({ label, value, hint }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest opacity-70">{label}</p>
      <p className="font-serif text-4xl mt-2">{value}</p>
      {hint && <p className="text-xs opacity-70 mt-1">{hint}</p>}
    </div>
  );
}
