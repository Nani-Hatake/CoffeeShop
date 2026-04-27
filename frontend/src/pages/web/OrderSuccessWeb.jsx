import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";

export default function OrderSuccessWeb() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);

  useEffect(() => {
    if (!order && id) {
      api.getOrder(id).then(setOrder).catch(() => {});
    }
  }, [id, order]);

  return (
    <WebShell>
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center mx-auto">
              <span
                className="material-symbols-outlined text-[64px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check
              </span>
            </div>
            <h1 className="font-serif text-5xl text-primary mt-8">Confirmed.</h1>
            <p className="text-on-surface-variant mt-4 text-lg max-w-md mx-auto">
              We just sent your order to the bar. Your morning ritual is on its way.
            </p>
            {order && (
              <p className="mt-4 text-sm">
                <span className="text-on-surface-variant">Reference</span>{" "}
                <span className="font-mono font-semibold text-primary text-base ml-2">{order.code}</span>
              </p>
            )}
          </div>

          {order && (
            <div className="mt-12 rounded-2xl bg-surface-container-low border border-outline-variant p-8">
              <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-4">
                Summary
              </p>
              <ul className="divide-y divide-outline-variant">
                {order.items.map((it) => (
                  <li key={it.id} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium text-on-surface">
                        {it.quantity}× {it.name}
                      </p>
                      {(it.size || it.milk) && (
                        <p className="text-sm text-on-surface-variant">
                          {it.size}{it.size && it.milk && " · "}{it.milk}
                        </p>
                      )}
                    </div>
                    <span className="text-primary font-medium">
                      ${(it.unit_price * it.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-outline-variant space-y-2">
                <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
                <Row label="Tax" value={`$${order.tax.toFixed(2)}`} />
                <div className="border-t border-outline-variant pt-2">
                  <Row
                    label={<span className="font-serif text-xl text-primary">Total paid</span>}
                    value={<span className="font-serif text-xl text-primary">${order.total.toFixed(2)}</span>}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-4 justify-center">
            <Link
              to="/orders"
              className="px-8 h-12 rounded-full bg-primary text-on-primary font-medium inline-flex items-center justify-center hover:opacity-90 transition"
            >
              View my orders
            </Link>
            <Link
              to="/home"
              className="px-8 h-12 rounded-full border border-outline-variant text-primary font-medium inline-flex items-center justify-center hover:bg-surface-container-low transition"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </WebShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-on-surface">{label}</span>
      <span>{value}</span>
    </div>
  );
}
