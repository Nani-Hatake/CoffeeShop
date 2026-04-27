import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);

  useEffect(() => {
    if (!order && id) {
      api.getOrder(id).then(setOrder).catch(() => {});
    }
  }, [id, order]);

  return (
    <AppShell title="Order confirmed" hideBottomNav>
      <div className="flex flex-col items-center text-center pt-8">
        <div className="w-24 h-24 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check
          </span>
        </div>
        <h1 className="font-serif text-[34px] text-primary mt-6">Confirmed.</h1>
        <p className="text-on-surface-variant mt-2 max-w-[300px]">
          We just sent your order to the bar. Your morning ritual is on its way.
        </p>
        {order && (
          <p className="mt-3 text-sm">
            <span className="text-on-surface-variant">Reference</span>{" "}
            <span className="font-mono font-semibold text-primary">{order.code}</span>
          </p>
        )}
      </div>

      {order && (
        <div className="mt-10 rounded-2xl bg-surface-container-low border border-outline-variant p-4">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Summary</p>
          <ul className="divide-y divide-outline-variant">
            {order.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between text-sm">
                <span>{it.quantity}× {it.name} {it.size ? `(${it.size})` : ""}</span>
                <span className="text-primary">${(it.unit_price * it.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-outline-variant mt-2 pt-2 flex justify-between font-serif text-primary">
            <span>Total paid</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-auto pt-10 flex flex-col gap-3 pb-6">
        <Link
          to="/orders"
          className="h-12 rounded-full bg-primary text-on-primary font-medium tracking-wide inline-flex items-center justify-center"
        >
          View my orders
        </Link>
        <Link
          to="/home"
          className="h-12 rounded-full border border-outline-variant text-primary font-medium tracking-wide inline-flex items-center justify-center"
        >
          Back to home
        </Link>
      </div>
    </AppShell>
  );
}
