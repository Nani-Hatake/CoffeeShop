import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";

export default function OrdersWeb() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Order history</p>
          <h1 className="font-serif text-5xl text-primary mt-2 mb-12">Every cup you've shared.</h1>

          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <span className="material-symbols-outlined text-[72px] text-outline">receipt_long</span>
              <h2 className="font-serif text-3xl text-primary mt-6">No orders yet</h2>
              <p className="text-on-surface-variant mt-3">
                Your future favourites are one tap away.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center px-8 h-12 rounded-full bg-primary text-on-primary font-medium mt-8 hover:opacity-90 transition"
              >
                Start your first ritual
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((o) => (
                <article
                  key={o.id}
                  className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-6 hover:border-primary hover:shadow-lg transition"
                >
                  <header className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono font-semibold text-primary">{o.code}</p>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary text-xs tracking-widest uppercase">
                        {o.status}
                      </span>
                      <span className="font-serif text-2xl text-primary">${o.total.toFixed(2)}</span>
                    </div>
                  </header>

                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between text-sm">
                        <span className="text-on-surface">
                          {it.quantity}× {it.name} {it.size && `(${it.size})`}
                        </span>
                        <span className="text-on-surface-variant">
                          ${(it.unit_price * it.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {o.pickup_store && (
                    <p className="text-sm text-on-surface-variant mt-4 pt-4 border-t border-outline-variant">
                      Pickup at <span className="text-primary">{o.pickup_store}</span>
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </WebShell>
  );
}
