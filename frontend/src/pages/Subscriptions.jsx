import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [cadence, setCadence] = useState("weekly");
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([api.listSubscriptions(), api.listProducts({ category: "beans" })])
      .then(([s, p]) => {
        setSubs(s);
        setProducts(p);
        if (p.length && !productId) setProductId(String(p[0].id));
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.createSubscription({ product_id: Number(productId), cadence, quantity: 1 });
      toast.push("Subscription scheduled.", { tone: "success" });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const cancel = async (id) => {
    await api.cancelSubscription(id);
    toast.push("Subscription cancelled.");
    load();
  };

  return (
    <AppShell title="Subscriptions" showBack>
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Recurring rituals</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">Beans, on a schedule.</h1>
      </section>

      <form
        onSubmit={create}
        className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 flex flex-col gap-3"
      >
        <label className="block">
          <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Bag</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full h-12 px-3 rounded-lg bg-white border border-outline-variant"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price.toFixed(2)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Cadence</span>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className="mt-1 w-full h-12 px-3 rounded-lg bg-white border border-outline-variant"
          >
            <option value="weekly">Every week</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Every month</option>
          </select>
        </label>
        <button className="h-12 rounded-full bg-primary text-on-primary font-medium">
          Schedule
        </button>
      </form>

      <h2 className="font-serif text-[22px] text-primary mt-8 mb-3">Active</h2>
      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="text-on-surface-variant">No subscriptions yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 pb-6">
          {subs.map((s) => (
            <li key={s.id} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-3 flex gap-3 items-center">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                {s.product.image_url && (
                  <img src={s.product.image_url} alt={s.product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[16px] text-primary leading-tight">
                  {s.product.name}
                </p>
                <p className="text-[12px] text-on-surface-variant capitalize">
                  {s.cadence} · {s.active ? "active" : "paused"}
                </p>
                {s.next_delivery && (
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Next: {new Date(s.next_delivery).toLocaleDateString()}
                  </p>
                )}
              </div>
              {s.active && (
                <button
                  onClick={() => cancel(s.id)}
                  className="text-on-surface-variant hover:text-error text-sm"
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-on-surface-variant mt-4">
        Need beans now?{" "}
        <Link to="/search" className="text-primary underline underline-offset-4">Browse the menu</Link>
      </p>
    </AppShell>
  );
}
