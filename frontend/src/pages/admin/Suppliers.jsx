import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

const EMPTY_SUPPLIER = {
  name: "", type: "bean", contact_name: "", email: "", phone: "", country: "", notes: "",
};

const EMPTY_BEAN = {
  supplier_id: "", origin: "", process: "", altitude: "", qty_kg: 0, direct_trade: false, notes: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [beans, setBeans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [beanForm, setBeanForm] = useState(EMPTY_BEAN);
  const toast = useToast();

  const load = () => {
    Promise.all([adminApi.listSuppliers(), adminApi.listGreenBeans()])
      .then(([s, b]) => { setSuppliers(s); setBeans(b); });
  };
  useEffect(load, []);

  const saveSupplier = async (form) => {
    try {
      if (form.id) {
        await adminApi.updateSupplier(form.id, form);
        toast.push("Supplier updated", { tone: "success" });
      } else {
        await adminApi.createSupplier(form);
        toast.push("Supplier added", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const deleteSupplier = async (s) => {
    if (!confirm(`Remove ${s.name}? Their green bean lots will also be deleted.`)) return;
    await adminApi.deleteSupplier(s.id);
    toast.push("Supplier removed");
    load();
  };

  const addBeans = async (e) => {
    e.preventDefault();
    try {
      await adminApi.addGreenBeans({
        ...beanForm,
        supplier_id: Number(beanForm.supplier_id),
        qty_kg: Number(beanForm.qty_kg),
      });
      toast.push("Green beans logged", { tone: "success" });
      setBeanForm(EMPTY_BEAN);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AdminShell
      title="Suppliers & sourcing"
      subtitle="Direct trade"
      actions={
        <button
          onClick={() => setEditing(EMPTY_SUPPLIER)}
          className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New supplier
        </button>
      }
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title={`Directory (${suppliers.length})`}>
          {suppliers.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">No suppliers yet.</p>
          ) : (
            <ul className="space-y-3">
              {suppliers.map((s) => (
                <li key={s.id} className="p-4 rounded-xl bg-surface-container-low">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg text-primary">{s.name}</p>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {s.type}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {s.contact_name && `${s.contact_name} · `}
                        {s.email && <a href={`mailto:${s.email}`} className="text-primary hover:underline">{s.email}</a>}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {s.country}
                        {s.phone && ` · ${s.phone}`}
                      </p>
                      {s.notes && (
                        <p className="text-sm text-on-surface mt-2 italic">{s.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setEditing(s)} className="text-primary hover:opacity-80" aria-label="Edit">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => deleteSupplier(s)} className="text-on-surface-variant hover:text-error" aria-label="Delete">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Green bean inventory">
            {beans.length === 0 ? (
              <p className="text-on-surface-variant text-center py-6">No green beans on hand.</p>
            ) : (
              <ul className="space-y-2">
                {beans.map((b) => (
                  <li key={b.id} className="p-3 rounded-lg bg-surface-container-low">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{b.origin}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {b.process} · {b.altitude} · {b.supplier_name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Arrived {new Date(b.arrived_at).toLocaleDateString()}
                          {b.direct_trade && " · 🤝 Direct trade"}
                        </p>
                      </div>
                      <span className="font-serif text-lg text-primary whitespace-nowrap">
                        {b.qty_kg} kg
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Log new green bean lot">
            <form onSubmit={addBeans} className="space-y-3">
              <select
                value={beanForm.supplier_id}
                onChange={(e) => setBeanForm({ ...beanForm, supplier_id: e.target.value })}
                required
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none"
              >
                <option value="">Select supplier…</option>
                {suppliers.filter((s) => s.type === "bean").map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input value={beanForm.origin} onChange={(e) => setBeanForm({ ...beanForm, origin: e.target.value })}
                placeholder="Origin (e.g. Yirgacheffe — Konga station)" required
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              <div className="grid grid-cols-3 gap-2">
                <input value={beanForm.process} onChange={(e) => setBeanForm({ ...beanForm, process: e.target.value })}
                  placeholder="Process" className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
                <input value={beanForm.altitude} onChange={(e) => setBeanForm({ ...beanForm, altitude: e.target.value })}
                  placeholder="Altitude" className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
                <input type="number" step="0.5" value={beanForm.qty_kg} onChange={(e) => setBeanForm({ ...beanForm, qty_kg: e.target.value })}
                  placeholder="Qty kg" className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={beanForm.direct_trade}
                  onChange={(e) => setBeanForm({ ...beanForm, direct_trade: e.target.checked })} />
                Direct trade
              </label>
              <button className="w-full h-11 rounded-full bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition">
                Log lot
              </button>
            </form>
          </Section>
        </div>
      </div>

      {editing && <SupplierEditor supplier={editing} onSave={saveSupplier} onClose={() => setEditing(null)} />}
    </AdminShell>
  );
}

function SupplierEditor({ supplier, onSave, onClose }) {
  const [form, setForm] = useState(supplier);
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-primary">
            {supplier.id ? "Edit supplier" : "New supplier"}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </header>

        <form onSubmit={submit} className="space-y-3">
          <input value={form.name} onChange={update("name")} placeholder="Supplier name" required
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          <select value={form.type} onChange={update("type")}
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
            <option value="bean">Green beans</option>
            <option value="dairy">Dairy & milk</option>
            <option value="packaging">Packaging</option>
            <option value="equipment">Equipment</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.contact_name || ""} onChange={update("contact_name")} placeholder="Contact name"
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            <input value={form.country || ""} onChange={update("country")} placeholder="Country"
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            <input type="email" value={form.email || ""} onChange={update("email")} placeholder="Email"
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            <input value={form.phone || ""} onChange={update("phone")} placeholder="Phone"
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          </div>
          <textarea value={form.notes || ""} onChange={update("notes")} placeholder="Notes"
            className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none text-sm" rows={3} />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-full border border-outline-variant text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              {supplier.id ? "Save" : "Add supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
