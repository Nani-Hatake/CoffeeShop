import { useCallback, useEffect, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

const EMPTY = {
  code: "", description: "", discount_type: "percent",
  discount_value: 10, valid_until: "", usage_limit: "", active: true,
};

export default function Promotions() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listPromotions();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (form) => {
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        valid_until: form.valid_until || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        active: form.active,
      };
      if (form.id) {
        await adminApi.updatePromotion(form.id, payload);
        toast.push("Promotion updated", { tone: "success" });
      } else {
        await adminApi.createPromotion(payload);
        toast.push("Promotion created", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete code ${p.code}?`)) return;
    await adminApi.deletePromotion(p.id);
    toast.push("Promotion removed");
    load();
  };

  return (
    <AdminShell
      title="Promotion engine"
      subtitle="Marketing"
      actions={
        <button
          onClick={() => setEditing(EMPTY)}
          className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New promotion
        </button>
      }
    >
      <Section title={loading ? "Loading…" : `${items.length} codes`}>
        {error ? (
          <div className="text-center py-8">
            <p className="text-error mb-3">{error}</p>
            <button
              onClick={load}
              className="px-4 h-9 rounded-full border border-outline-variant text-sm"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <p className="text-on-surface-variant text-center py-8">Loading promotions…</p>
        ) : items.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">No promotions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="py-3 pr-3">Code</th>
                <th className="py-3 pr-3">Discount</th>
                <th className="py-3 pr-3">Description</th>
                <th className="py-3 pr-3">Usage</th>
                <th className="py-3 pr-3">Expires</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-outline-variant last:border-0">
                  <td className="py-3 pr-3 font-mono font-semibold text-primary">{p.code}</td>
                  <td className="py-3 pr-3">
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `$${p.discount_value.toFixed(2)}`}
                  </td>
                  <td className="py-3 pr-3 text-on-surface-variant">{p.description}</td>
                  <td className="py-3 pr-3">
                    {p.usage_count}
                    {p.usage_limit ? `/${p.usage_limit}` : ""}
                  </td>
                  <td className="py-3 pr-3 text-on-surface-variant">
                    {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={
                      "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold " +
                      (p.active
                        ? "bg-tertiary-container text-on-tertiary"
                        : "bg-surface-container text-on-surface-variant")
                    }>
                      {p.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="text-primary hover:opacity-80 mr-2">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => remove(p)} className="text-on-surface-variant hover:text-error">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {editing && <Editor promo={editing} onSave={save} onClose={() => setEditing(null)} />}
    </AdminShell>
  );
}

function Editor({ promo, onSave, onClose }) {
  const initial = {
    ...promo,
    valid_until: promo.valid_until ? promo.valid_until.slice(0, 10) : "",
  };
  const [form, setForm] = useState(initial);
  const update = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  const submit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-primary">
            {promo.id ? "Edit promotion" : "New promotion"}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </header>

        <form onSubmit={submit} className="space-y-3">
          <input value={form.code} onChange={update("code")} placeholder="WELCOME10" required
            disabled={!!promo.id}
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none uppercase tracking-widest font-mono disabled:opacity-60" />
          <input value={form.description} onChange={update("description")} placeholder="Description"
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.discount_type} onChange={update("discount_type")}
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount ($)</option>
            </select>
            <input type="number" step="0.5" min={0} value={form.discount_value}
              onChange={update("discount_value")} placeholder="Value" required
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Valid until</span>
              <input type="date" value={form.valid_until} onChange={update("valid_until")}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Usage limit</span>
              <input type="number" value={form.usage_limit || ""} onChange={update("usage_limit")} placeholder="∞"
                className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={update("active")} />
            Active
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-full border border-outline-variant text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              {promo.id ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
