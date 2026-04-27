import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";

export default function Locations() {
  const [rows, setRows] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    ownerApi.compareLocations(days).then(setRows);
  }, [days]);

  const fmt = (v) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));
  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);

  return (
    <AdminShell
      title="Atelier comparison"
      subtitle="Owner · Multi-location"
      actions={
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      }
    >
      <Section title={`${rows.length} locations · ${fmt(totalRevenue)} total revenue`}>
        {rows.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">No location data yet.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const sharePct = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0;
              return (
                <article
                  key={`${r.store_id}-${r.store_name}`}
                  className="rounded-2xl bg-surface-container-low border border-outline-variant p-5"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-serif text-2xl text-primary">{r.store_name}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {sharePct.toFixed(1)}% of total revenue
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Revenue</p>
                        <p className="font-serif text-2xl text-primary">{fmt(r.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Orders</p>
                        <p className="font-serif text-2xl text-primary">{r.orders}</p>
                      </div>
                    </div>
                  </header>

                  {/* Revenue bar */}
                  <div className="h-3 rounded-full bg-surface-container-high overflow-hidden mb-4">
                    <div className="h-full bg-primary" style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Mini label="Avg order value" value={fmt(r.avg_order_value)} />
                    <Mini label="Labor cost" value={fmt(r.labor_cost)} />
                    <Mini label="Labor %" value={`${r.labor_pct}%`}
                      tone={r.labor_pct > 35 ? "warning" : r.labor_pct > 0 ? "ok" : undefined} />
                    <Mini label="Waste cost" value={fmt(r.waste_cost)} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </AdminShell>
  );
}

function Mini({ label, value, tone }) {
  const toneClass =
    tone === "warning" ? "bg-error-container text-on-error-container"
    : tone === "ok" ? "bg-tertiary-container text-on-tertiary"
    : "bg-white";
  return (
    <div className={`rounded-lg p-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-80">{label}</p>
      <p className="font-serif text-lg mt-0.5">{value}</p>
    </div>
  );
}
