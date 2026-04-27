import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Your orders">
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Order history</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">Every cup you've shared.</h1>
      </section>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <span className="material-symbols-outlined text-[56px] text-outline">receipt_long</span>
          <h2 className="font-serif text-[24px] text-primary mt-4">No orders yet</h2>
          <p className="text-on-surface-variant mt-2 max-w-[280px]">
            Your future favourites are one tap away.
          </p>
          <Link to="/home" className="mt-6 px-6 h-12 rounded-full bg-primary text-on-primary font-medium inline-flex items-center justify-center">
            Start your first ritual
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 pb-6">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-mono font-semibold text-primary text-sm">{o.code}</p>
                  <p className="text-[12px] text-on-surface-variant">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary text-[11px] tracking-widest uppercase">
                  {o.status}
                </span>
              </div>

              <ul className="mt-3 text-sm text-on-surface space-y-0.5">
                {o.items.slice(0, 3).map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.quantity}× {it.name}</span>
                    <span className="text-on-surface-variant">${(it.unit_price * it.quantity).toFixed(2)}</span>
                  </li>
                ))}
                {o.items.length > 3 && (
                  <li className="text-[12px] text-on-surface-variant">+{o.items.length - 3} more</li>
                )}
              </ul>

              <div className="border-t border-outline-variant my-3" />
              <div className="flex justify-between font-medium text-primary">
                <span>Total</span>
                <span>${o.total.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
