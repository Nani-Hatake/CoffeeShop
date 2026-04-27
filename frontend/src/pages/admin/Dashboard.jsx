import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdminShell, { Section, StatCard } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [inv, setInv] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    adminApi.dashboard().then(setSummary);
    adminApi.inventoryStats().then(setInv);
    adminApi.loyaltyStats().then(setLoyalty);
  }, []);

  useEffect(() => {
    adminApi.sales(period).then(setSales);
  }, [period]);

  const fmtMoney = (v) => `$${(v ?? 0).toFixed(2)}`;
  const trend = (today, yesterday) => {
    if (!yesterday) return "—";
    const diff = today - yesterday;
    const pct = Math.round((diff / yesterday) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}% vs yesterday`;
  };

  const maxRevenue = sales && sales.series.length
    ? Math.max(...sales.series.map((s) => s.revenue), 1)
    : 1;

  return (
    <AdminShell title="Atelier overview" subtitle="Today">
      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="payments"
          label="Today's revenue"
          value={summary ? fmtMoney(summary.today_revenue) : "—"}
          delta={summary ? trend(summary.today_revenue, summary.yesterday_revenue) : null}
        />
        <StatCard
          icon="receipt_long"
          label="Today's orders"
          value={summary?.today_orders ?? "—"}
          delta={summary ? `${summary.in_progress} in progress · ${summary.ready_pickup} ready` : null}
          accent="tertiary"
        />
        <StatCard
          icon="warning"
          label="Low / out-of-stock"
          value={inv ? inv.low_stock.length + inv.out_of_stock.length : "—"}
          delta={inv ? `${inv.out_of_stock.length} out · ${inv.low_stock.length} low` : null}
          accent="warning"
        />
        <StatCard
          icon="groups"
          label="Customers"
          value={summary?.total_customers ?? "—"}
          delta={loyalty ? `${loyalty.active_members} active · ${loyalty.total_redemptions} redemptions` : null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <Section
          title="Revenue"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1 text-xs">
              {["day", "week", "month"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={
                    "px-3 h-8 rounded-full transition " +
                    (period === p
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container")
                  }
                >
                  {p === "day" ? "24h" : p === "week" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          }
        >
          {!sales ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : sales.series.length === 0 ? (
            <p className="text-on-surface-variant py-8 text-center">
              No completed orders in this period yet.
            </p>
          ) : (
            <div>
              <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Revenue</p>
                  <p className="font-serif text-3xl text-primary">{fmtMoney(sales.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Orders</p>
                  <p className="font-serif text-3xl text-primary">{sales.total_orders}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">AOV</p>
                  <p className="font-serif text-3xl text-primary">{fmtMoney(sales.avg_order_value)}</p>
                </div>
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-2 h-40 mt-4 border-b border-outline-variant pb-1">
                {sales.series.map((s) => (
                  <div key={s.label} className="flex-1 flex flex-col items-center justify-end group" title={`${s.label}: ${fmtMoney(s.revenue)}`}>
                    <div
                      className="w-full bg-primary-container rounded-t-md transition-all group-hover:bg-primary"
                      style={{ height: `${(s.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-2">
                {sales.series.length > 0 && (
                  <>
                    <span>{sales.series[0].label}</span>
                    <span>{sales.series[sales.series.length - 1].label}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* Top products */}
        <Section title="Top products">
          {!sales || sales.top_products.length === 0 ? (
            <p className="text-on-surface-variant text-center py-8">No sales data yet.</p>
          ) : (
            <ul className="space-y-3">
              {sales.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.qty} sold</p>
                  </div>
                  <span className="text-sm text-primary font-medium">{fmtMoney(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock alerts */}
        <Section
          title="Stock alerts"
          action={<Link to="/admin/inventory" className="text-sm text-primary underline underline-offset-4">Manage</Link>}
        >
          {!inv ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : inv.low_stock.length === 0 && inv.out_of_stock.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">All stock levels healthy.</p>
          ) : (
            <ul className="space-y-2">
              {[...inv.out_of_stock.map((s) => ({ ...s, severity: "out" })),
                ...inv.low_stock.map((s) => ({ ...s, severity: "low" }))].map((s) => (
                <li
                  key={s.product_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low"
                >
                  <span
                    className={
                      "w-2 h-2 rounded-full " +
                      (s.severity === "out" ? "bg-error" : "bg-amber-500")
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {s.severity === "out"
                        ? "Out of stock"
                        : `${s.on_hand} left · threshold ${s.low_threshold}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Loyalty */}
        <Section
          title="Loyalty pulse"
          action={<Link to="/admin/loyalty" className="text-sm text-primary underline underline-offset-4">Rules</Link>}
        >
          {!loyalty ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Mini label="Points issued" value={loyalty.total_points_issued.toLocaleString()} />
                <Mini label="Redemptions" value={loyalty.total_redemptions} />
                <Mini label="Active members" value={loyalty.active_members} />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-2">
                Top redeemed
              </p>
              {loyalty.top_rewards?.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No redemptions yet.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {loyalty.top_rewards?.map((r) => (
                    <li key={r.title} className="flex justify-between">
                      <span>{r.title}</span>
                      <span className="text-on-surface-variant">{r.count}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Section>
      </div>
    </AdminShell>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-xl text-primary mt-1">{value}</p>
    </div>
  );
}
