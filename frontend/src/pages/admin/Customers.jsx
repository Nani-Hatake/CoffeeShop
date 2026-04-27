import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    adminApi.listCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      setDetail(null);
      adminApi.customerDetail(selected.id).then(setDetail);
    }
  }, [selected]);

  const filtered = customers.filter((c) =>
    !q || c.email.toLowerCase().includes(q.toLowerCase())
       || (c.full_name || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AdminShell title="Customers" subtitle="CRM">
      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
        <Section
          title={`${filtered.length} customers`}
          action={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm w-44"
            />
          }
        >
          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">No customers found.</p>
          ) : (
            <ul className="space-y-1 max-h-[600px] overflow-y-auto">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className={
                      "w-full text-left p-3 rounded-lg transition flex items-center gap-3 " +
                      (selected?.id === c.id
                        ? "bg-primary text-on-primary"
                        : "hover:bg-surface-container-low")
                    }
                  >
                    <div className={
                      "w-9 h-9 rounded-full flex items-center justify-center font-serif " +
                      (selected?.id === c.id
                        ? "bg-on-primary/20"
                        : "bg-primary text-on-primary")
                    }>
                      {(c.full_name || c.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{c.full_name || "—"}</p>
                      <p className={"text-xs truncate " + (selected?.id === c.id ? "opacity-80" : "text-on-surface-variant")}>
                        {c.email}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p>{c.order_count} orders</p>
                      <p className={selected?.id === c.id ? "opacity-80" : "text-on-surface-variant"}>
                        ${c.total_spent.toFixed(0)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {!selected ? (
          <div className="flex items-center justify-center min-h-[400px] rounded-2xl bg-white border border-outline-variant">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] text-outline">person_search</span>
              <p className="text-on-surface-variant mt-3">Select a customer to view their profile.</p>
            </div>
          </div>
        ) : !detail ? (
          <div className="flex items-center justify-center min-h-[400px] rounded-2xl bg-white border border-outline-variant">
            <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
          </div>
        ) : (
          <div className="space-y-4">
            <Section title="Profile">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif text-2xl">
                  {(detail.full_name || detail.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-serif text-2xl text-primary">{detail.full_name || "—"}</p>
                  <p className="text-on-surface-variant text-sm">{detail.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Tier" value={detail.tier} />
                <Stat label="Points" value={detail.points} />
                <Stat label="Orders" value={detail.order_count} />
                <Stat label="Spent" value={`$${detail.total_spent.toFixed(2)}`} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Joined">
                  {new Date(detail.created_at).toLocaleDateString()}
                </Field>
                <Field label="Last order">
                  {detail.last_order_at ? new Date(detail.last_order_at).toLocaleDateString() : "—"}
                </Field>
                <Field label="Top ritual">
                  {detail.top_ritual || "—"}
                </Field>
                <Field label="Verified">
                  {detail.is_verified ? "Yes" : "No"}
                </Field>
              </div>
            </Section>

            <Section title="Recent orders">
              {detail.recent_orders.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">No orders yet.</p>
              ) : (
                <ul className="space-y-1">
                  {detail.recent_orders.map((o) => (
                    <li key={o.id} className="flex justify-between items-center p-2 hover:bg-surface-container-low rounded-lg text-sm">
                      <span className="font-mono">{o.code}</span>
                      <span className="text-on-surface-variant">{o.item_count} items</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container uppercase tracking-widest">
                        {o.status}
                      </span>
                      <span className="font-medium">${o.total.toFixed(2)}</span>
                      <span className="text-on-surface-variant text-xs">{new Date(o.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {detail.favourites.length > 0 && (
              <Section title="Favourites">
                <ul className="grid grid-cols-3 gap-2">
                  {detail.favourites.map((f) => (
                    <li key={f.product_id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
                      <div className="w-8 h-8 rounded bg-surface-container-high overflow-hidden flex-shrink-0">
                        {f.image_url && <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-xs truncate">{f.name}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-xl text-primary mt-1">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="text-on-surface mt-0.5">{children}</p>
    </div>
  );
}
