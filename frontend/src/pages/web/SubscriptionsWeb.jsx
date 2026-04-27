import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function SubscriptionsWeb() {
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

  const selectedProduct = products.find((p) => String(p.id) === productId);

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Recurring rituals</p>
          <h1 className="font-serif text-5xl text-primary mt-2 mb-12">Beans, on a schedule.</h1>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Schedule form */}
            <div>
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-8">
                <h2 className="font-serif text-2xl text-primary mb-6">Schedule a delivery</h2>
                <form onSubmit={create} className="space-y-5">
                  <label className="block">
                    <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Bag</span>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="mt-2 w-full h-12 px-3 rounded-lg bg-white border border-outline-variant focus:border-primary outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Cadence</span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        { v: "weekly", l: "Weekly" },
                        { v: "biweekly", l: "Bi-weekly" },
                        { v: "monthly", l: "Monthly" },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setCadence(opt.v)}
                          className={
                            "h-12 rounded-lg border transition " +
                            (cadence === opt.v
                              ? "bg-primary text-on-primary border-primary"
                              : "bg-white text-on-surface border-outline-variant hover:border-primary")
                          }
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </label>
                  <button className="w-full h-12 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition">
                    Schedule subscription
                  </button>
                </form>
              </div>

              {selectedProduct && (
                <div className="mt-6 rounded-2xl bg-surface-container-lowest border border-outline-variant p-6 flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                    {selectedProduct.image_url && (
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-primary">{selectedProduct.name}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">{selectedProduct.subtitle}</p>
                    <p className="text-sm text-primary mt-2">
                      ${selectedProduct.price.toFixed(2)} · {cadence}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Active subscriptions */}
            <div>
              <h2 className="font-serif text-2xl text-primary mb-6">Active subscriptions</h2>
              {loading ? (
                <p className="text-on-surface-variant">Loading…</p>
              ) : subs.length === 0 ? (
                <div className="rounded-2xl bg-surface-container-low border border-dashed border-outline-variant p-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-outline">autorenew</span>
                  <p className="text-on-surface-variant mt-4">No subscriptions yet.</p>
                  <p className="text-on-surface-variant text-sm mt-1">Schedule your first delivery to get started.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {subs.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-5 flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                        {s.product.image_url && (
                          <img src={s.product.image_url} alt={s.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-primary leading-tight">{s.product.name}</p>
                        <p className="text-sm text-on-surface-variant capitalize">
                          {s.cadence} · {s.active ? "active" : "paused"}
                        </p>
                        {s.next_delivery && (
                          <p className="text-xs text-on-surface-variant mt-1">
                            Next: {new Date(s.next_delivery).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {s.active && (
                        <button
                          onClick={() => cancel(s.id)}
                          className="text-on-surface-variant hover:text-error transition"
                        >
                          Cancel
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-sm text-on-surface-variant mt-6">
                Need beans now?{" "}
                <Link to="/search" className="text-primary underline underline-offset-4">Browse the menu</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
