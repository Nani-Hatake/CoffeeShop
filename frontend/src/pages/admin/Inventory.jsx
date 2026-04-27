import { useEffect, useState } from "react";

import AdminShell, { Section, StatCard } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [edit, setEdit] = useState({}); // {productId: {on_hand, low_threshold}}
  const [wasteForm, setWasteForm] = useState({ product_id: "", qty: 1, reason: "", cost: 0 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.listStock(),
      adminApi.listWaste(),
      adminApi.inventoryStats(),
      adminApi.listProducts(),
    ])
      .then(([s, w, st, p]) => { setStock(s); setWaste(w); setStats(st); setProducts(p); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (s) => {
    const patch = edit[s.product_id];
    if (!patch) return;
    try {
      await adminApi.updateStock(s.product_id, patch);
      toast.push("Stock updated", { tone: "success" });
      setEdit((e) => { const n = { ...e }; delete n[s.product_id]; return n; });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const logWaste = async (e) => {
    e.preventDefault();
    try {
      await adminApi.logWaste({
        product_id: Number(wasteForm.product_id),
        qty: Number(wasteForm.qty),
        reason: wasteForm.reason,
        cost: Number(wasteForm.cost),
      });
      toast.push("Waste logged");
      setWasteForm({ product_id: "", qty: 1, reason: "", cost: 0 });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AdminShell title="Inventory" subtitle="Stock & waste">
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon="warning" label="Out of stock" value={stats.out_of_stock.length}
            accent="warning" delta={stats.out_of_stock.length > 0 ? "Hidden from menu" : "All in stock"} />
          <StatCard icon="trending_down" label="Low stock" value={stats.low_stock.length}
            accent="warning" delta="Below threshold" />
          <StatCard icon="restore_from_trash" label="Waste cost (all-time)" value={`$${stats.waste_total.toFixed(2)}`}
            delta={`${stats.waste_count} entries`} />
          <StatCard icon="autorenew" label="Top mover (30d)"
            value={stats.turn_rate[0]?.sold_30d || 0}
            delta={stats.turn_rate[0]?.name || "—"} accent="tertiary" />
        </div>
      )}

      <Section title="Stock levels" className="mb-6">
        {loading ? (
          <p className="text-on-surface-variant">Loading…</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-3 py-3">On hand</th>
                  <th className="px-3 py-3">Threshold</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => {
                  const editing = edit[s.product_id];
                  const onHand = editing?.on_hand ?? s.on_hand;
                  const threshold = editing?.low_threshold ?? s.low_threshold;
                  const isLow = onHand <= threshold;
                  const isOut = onHand === 0;
                  return (
                    <tr key={s.id} className="border-b border-outline-variant last:border-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                            {s.image_url && <img src={s.image_url} alt={s.product_name} className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-medium">{s.product_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={onHand}
                          min={0}
                          onChange={(e) => setEdit((p) => ({
                            ...p,
                            [s.product_id]: { ...p[s.product_id], on_hand: Number(e.target.value) }
                          }))}
                          className="w-20 h-9 px-2 rounded-md bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={threshold}
                          min={0}
                          onChange={(e) => setEdit((p) => ({
                            ...p,
                            [s.product_id]: { ...p[s.product_id], low_threshold: Number(e.target.value) }
                          }))}
                          className="w-20 h-9 px-2 rounded-md bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span className={
                          "px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold " +
                          (isOut ? "bg-error-container text-on-error-container"
                            : isLow ? "bg-amber-100 text-amber-900"
                            : "bg-tertiary-container text-on-tertiary")
                        }>
                          {isOut ? "Out" : isLow ? "Low" : "OK"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {editing && (
                          <button
                            onClick={() => save(s)}
                            className="px-3 h-9 rounded-full bg-primary text-on-primary text-xs font-medium"
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Log waste">
          <form onSubmit={logWaste} className="space-y-3">
            <select
              value={wasteForm.product_id}
              onChange={(e) => setWasteForm({ ...wasteForm, product_id: e.target.value })}
              required
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" min={1} value={wasteForm.qty}
                onChange={(e) => setWasteForm({ ...wasteForm, qty: e.target.value })}
                placeholder="Qty"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
              <input
                type="number" step="0.01" value={wasteForm.cost}
                onChange={(e) => setWasteForm({ ...wasteForm, cost: e.target.value })}
                placeholder="Cost ($)"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
            <input
              value={wasteForm.reason}
              onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
              placeholder="Reason (e.g. past best-by, spilled)"
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
            />
            <button className="w-full h-11 rounded-full bg-primary text-on-primary font-medium text-sm hover:opacity-90 transition">
              Log waste
            </button>
          </form>
        </Section>

        <Section title="Recent waste">
          {waste.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">No waste logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {waste.slice(0, 8).map((w) => (
                <li key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{w.product_name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {w.reason || "No reason"} · {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-on-surface-variant">{w.qty} units</span>
                  <span className="font-medium text-error">${w.cost.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {stats && stats.turn_rate.length > 0 && (
        <Section title="Inventory turn rate (last 30 days)" className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant">
                <th className="py-2">Product</th>
                <th className="py-2">Sold (30d)</th>
                <th className="py-2">On hand</th>
                <th className="py-2">Turn rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.turn_rate.map((t) => (
                <tr key={t.product_id} className="border-t border-outline-variant">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2">{t.sold_30d}</td>
                  <td className="py-2">{t.on_hand}</td>
                  <td className="py-2">{t.rate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </AdminShell>
  );
}
