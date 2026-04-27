import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

const STATUS_TONE = {
  brewing:   "bg-amber-100 text-amber-900",
  confirmed: "bg-amber-100 text-amber-900",
  ready:     "bg-tertiary-container text-on-tertiary",
  collected: "bg-surface-container-low text-on-surface-variant",
  cancelled: "bg-error-container text-on-error-container",
  refunded:  "bg-error-container text-on-error-container",
};

const NEXT_ACTION = {
  brewing:   { to: "ready",     label: "Mark ready" },
  confirmed: { to: "ready",     label: "Mark ready" },
  ready:     { to: "collected", label: "Mark collected" },
};

export default function Orders() {
  const [tab, setTab] = useState("live"); // live | all
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundFor, setRefundFor] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const toast = useToast();

  const refresh = () => {
    setLoading(true);
    const promise = tab === "live" ? adminApi.liveOrders() : adminApi.listOrders();
    promise.then(setOrders).finally(() => setLoading(false));
  };

  useEffect(refresh, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh live tab every 15s
  useEffect(() => {
    if (tab !== "live") return;
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = async (order) => {
    const next = NEXT_ACTION[order.status];
    if (!next) return;
    try {
      await adminApi.updateOrderStatus(order.id, { status: next.to });
      toast.push(`Order ${order.code} → ${next.to}`, { tone: "success" });
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const submitRefund = async () => {
    if (!refundFor) return;
    try {
      await adminApi.updateOrderStatus(refundFor.id, {
        status: "refunded",
        refund_reason: refundReason || "Customer service refund",
      });
      toast.push(`Order ${refundFor.code} refunded`, { tone: "success" });
      setRefundFor(null);
      setRefundReason("");
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AdminShell
      title="Order operations"
      subtitle="Live"
      actions={
        <div className="flex gap-1">
          {[
            { v: "live", label: "Live" },
            { v: "all",  label: "All" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={
                "px-4 h-9 rounded-full text-sm transition " +
                (tab === t.v
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : orders.length === 0 ? (
        <Section title={tab === "live" ? "Nothing brewing" : "No orders"}>
          <p className="text-on-surface-variant text-center py-12">
            {tab === "live"
              ? "All caught up — no orders waiting on the bar."
              : "Orders will appear here as customers check out."}
          </p>
        </Section>
      ) : (
        <div className="grid gap-4">
          {orders.map((o) => {
            const next = NEXT_ACTION[o.status];
            const tone = STATUS_TONE[o.status] || "bg-surface-container-low";
            return (
              <article
                key={o.id}
                className="rounded-2xl bg-white border border-outline-variant p-5"
              >
                <header className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="font-mono font-semibold text-primary text-lg">{o.code}</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      {o.user_name || o.user_email} · {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[11px] tracking-widest uppercase font-semibold ${tone}`}>
                      {o.status}
                    </span>
                    <span className="font-serif text-2xl text-primary">${o.total.toFixed(2)}</span>
                  </div>
                </header>

                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mb-4">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between text-sm">
                      <span className="text-on-surface">
                        {it.quantity}× {it.name}
                        {it.size ? ` (${it.size})` : ""}{it.milk ? ` · ${it.milk}` : ""}
                      </span>
                      <span className="text-on-surface-variant">
                        ${(it.unit_price * it.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                {o.note && (
                  <p className="text-sm text-on-surface-variant italic mb-3">
                    Note: {o.note}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-outline-variant">
                  {next && (
                    <button
                      onClick={() => advance(o)}
                      className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {next.to === "ready" ? "check_circle" : "task_alt"}
                      </span>
                      {next.label}
                    </button>
                  )}
                  {!["cancelled", "refunded", "collected"].includes(o.status) && (
                    <button
                      onClick={() => setRefundFor(o)}
                      className="px-4 h-10 rounded-full border border-outline-variant text-on-surface-variant text-sm hover:border-error hover:text-error transition"
                    >
                      Refund / Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Refund modal */}
      {refundFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-serif text-2xl text-primary">Refund {refundFor.code}?</h3>
            <p className="text-on-surface-variant mt-2 text-sm">
              This will mark the order as refunded, deduct the points awarded, and notify the customer.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for the customer (optional)"
              rows={3}
              className="mt-4 w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRefundFor(null); setRefundReason(""); }}
                className="flex-1 h-11 rounded-full border border-outline-variant text-on-surface text-sm"
              >
                Keep order
              </button>
              <button
                onClick={submitRefund}
                className="flex-1 h-11 rounded-full bg-error text-on-error text-sm font-medium"
              >
                Confirm refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
