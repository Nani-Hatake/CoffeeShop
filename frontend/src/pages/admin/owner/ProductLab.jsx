import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";
import { useToast } from "../../../contexts/ToastContext.jsx";

const EMPTY = {
  slug: "", name: "", subtitle: "", description: "",
  category_id: null, price: 5, cost_per_unit: 1.5, image_url: "",
  origin: "", roast: "", process: "", altitude: "", tasting_notes: "",
  is_featured: false, is_seasonal: false, is_limited: false, is_available: false,
};

export default function ProductLab() {
  const [sandbox, setSandbox] = useState([]);
  const [margins, setMargins] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [marginForm, setMarginForm] = useState({ category_id: "", target_pct: 70, notes: "" });
  const toast = useToast();

  const load = () => {
    ownerApi.listSandbox().then(setSandbox);
    ownerApi.listMargins().then(setMargins);
    ownerApi.pricingSuggestions().then(setSuggestions);
    ownerApi.listCategories().then(setCategories);
  };
  useEffect(load, []);

  const save = async (form) => {
    try {
      if (form.id) {
        await ownerApi.updateSandbox(form.id, form);
        toast.push("Prototype updated", { tone: "success" });
      } else {
        await ownerApi.createSandbox(form);
        toast.push("Prototype created", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const publish = async (p) => {
    if (!confirm(`Publish "${p.name}" to the live storefront? Customers will see it immediately.`)) return;
    try {
      await ownerApi.publishSandbox(p.id, { is_featured: false });
      toast.push(`${p.name} is live`, { tone: "success" });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const remove = async (p) => {
    if (!confirm(`Discard prototype "${p.name}"?`)) return;
    await ownerApi.deleteSandbox(p.id);
    toast.push("Prototype discarded");
    load();
  };

  const upsertMargin = async (e) => {
    e.preventDefault();
    try {
      await ownerApi.upsertMargin({
        category_id: Number(marginForm.category_id),
        target_pct: Number(marginForm.target_pct),
        notes: marginForm.notes,
      });
      toast.push("Margin target saved", { tone: "success" });
      setMarginForm({ category_id: "", target_pct: 70, notes: "" });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AdminShell
      title="Product lab"
      subtitle="Owner · Innovation & pricing"
      actions={
        <button
          onClick={() => setEditing({ ...EMPTY, category_id: categories[0]?.id })}
          className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">science</span>
          New prototype
        </button>
      }
    >
      {/* Sandbox products */}
      <Section title={`Sandbox · ${sandbox.length} prototypes`} className="mb-6">
        {sandbox.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">
            No prototypes yet. Lab products are hidden from the storefront until you publish them.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sandbox.map((p) => (
              <article key={p.id} className="rounded-2xl bg-surface-container-low border border-outline-variant overflow-hidden">
                <div className="relative aspect-[3/2] bg-surface-container-high">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] uppercase tracking-widest font-semibold">
                    Sandbox
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-lg text-primary">{p.name}</h3>
                  <p className="text-sm text-on-surface-variant">{p.subtitle}</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>Price <strong>${p.price.toFixed(2)}</strong></span>
                    <span className="text-on-surface-variant">
                      Margin {p.price > 0 ? Math.round(((p.price - (p.cost_per_unit || 0)) / p.price) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => publish(p)}
                      className="flex-1 h-9 rounded-full bg-primary text-on-primary text-xs font-medium">
                      Publish live
                    </button>
                    <button onClick={() => setEditing(p)} className="h-9 px-3 rounded-full border border-outline-variant text-xs">
                      Edit
                    </button>
                    <button onClick={() => remove(p)} className="h-9 w-9 rounded-full border border-outline-variant text-on-surface-variant hover:text-error flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Margin targets */}
        <Section title="Margin targets">
          <p className="text-sm text-on-surface-variant mb-4">
            Set a target gross margin for each category. The system will flag products that
            fall outside the target range and suggest price adjustments.
          </p>
          <ul className="space-y-2 mb-4">
            {margins.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-sm">
                <span className="font-medium flex-1">{m.category_name}</span>
                <span className="font-serif text-2xl text-primary">{m.target_pct}%</span>
              </li>
            ))}
          </ul>

          <form onSubmit={upsertMargin} className="space-y-2 pt-3 border-t border-outline-variant">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
              Set / update a target
            </p>
            <div className="grid grid-cols-2 gap-2">
              <select required value={marginForm.category_id}
                onChange={(e) => setMarginForm({ ...marginForm, category_id: e.target.value })}
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
                <option value="">Category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" step="1" min="1" max="99" value={marginForm.target_pct}
                onChange={(e) => setMarginForm({ ...marginForm, target_pct: e.target.value })}
                placeholder="Target %"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            </div>
            <button className="w-full h-10 rounded-full bg-primary text-on-primary text-sm font-medium">
              Save target
            </button>
          </form>
        </Section>

        {/* Pricing suggestions */}
        <Section title="Pricing suggestions">
          {suggestions.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">
              Set product `cost_per_unit` and a category margin target to see suggestions.
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.product_id} className="p-3 rounded-lg bg-surface-container-low">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{s.name}</span>
                    <SuggestionPill suggestion={s.suggestion} />
                  </div>
                  <div className="text-xs text-on-surface-variant grid grid-cols-3 gap-2">
                    <div>Price <strong className="text-primary">${s.current_price.toFixed(2)}</strong></div>
                    <div>Margin <strong className="text-primary">{s.current_margin_pct}%</strong>
                      {s.target_margin_pct && ` → ${s.target_margin_pct}%`}</div>
                    <div className="text-right">
                      {s.suggested_price && (
                        <>Suggested <strong className="text-primary">${s.suggested_price.toFixed(2)}</strong></>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {editing && (
        <Editor product={editing} categories={categories} onSave={save} onClose={() => setEditing(null)} />
      )}
    </AdminShell>
  );
}

function SuggestionPill({ suggestion }) {
  const map = {
    raise: { tone: "bg-error-container text-on-error-container", label: "↑ Raise price" },
    lower: { tone: "bg-amber-100 text-amber-900", label: "↓ Lower price" },
    ok: { tone: "bg-tertiary-container text-on-tertiary", label: "✓ On target" },
  };
  const cfg = map[suggestion] || map.ok;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

function Editor({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState(product);
  const update = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked
      : e.target.type === "number" ? Number(e.target.value)
      : e.target.value;
    setForm({ ...form, [k]: v });
  };
  const submit = (e) => { e.preventDefault(); onSave({ ...form, category_id: form.category_id || categories[0]?.id }); };
  const isNew = !product.id;
  const margin = form.price > 0 ? Math.round(((form.price - (form.cost_per_unit || 0)) / form.price) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto my-6 p-6">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-primary">
            {isNew ? "New prototype" : `Edit · ${product.name}`}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </header>

        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="Slug" required>
            <input value={form.slug} onChange={update("slug")} required disabled={!isNew} className="input" />
          </Field>
          <Field label="Name" required>
            <input value={form.name} onChange={update("name")} required className="input" />
          </Field>
          <Field label="Subtitle" full>
            <input value={form.subtitle || ""} onChange={update("subtitle")} className="input" />
          </Field>
          <Field label="Category">
            <select value={form.category_id || ""} onChange={update("category_id")} className="input">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Image URL">
            <input value={form.image_url || ""} onChange={update("image_url")} className="input" />
          </Field>
          <Field label={`Price ($) · margin ${margin}%`} required>
            <input type="number" step="0.05" value={form.price} onChange={update("price")} required className="input" />
          </Field>
          <Field label="Cost per unit ($)">
            <input type="number" step="0.05" value={form.cost_per_unit} onChange={update("cost_per_unit")} className="input" />
          </Field>
          <Field label="Description" full>
            <textarea value={form.description || ""} onChange={update("description")} rows={3} className="input" />
          </Field>
          <Field label="Origin">
            <input value={form.origin || ""} onChange={update("origin")} className="input" />
          </Field>
          <Field label="Roast">
            <input value={form.roast || ""} onChange={update("roast")} className="input" />
          </Field>
          <Field label="Process">
            <input value={form.process || ""} onChange={update("process")} className="input" />
          </Field>
          <Field label="Altitude">
            <input value={form.altitude || ""} onChange={update("altitude")} className="input" />
          </Field>
          <Field label="Tasting notes" full>
            <input value={form.tasting_notes || ""} onChange={update("tasting_notes")} className="input" />
          </Field>

          <div className="sm:col-span-2 flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-full border border-outline-variant text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              {isNew ? "Create prototype" : "Save"}
            </button>
          </div>
        </form>

        <style>{`
          .input { width: 100%; height: 40px; padding: 0 12px; border-radius: 8px;
            background: #fff1e4; border: 1px solid #d3c3c0; outline: none; }
          .input:focus { border-color: #271310; }
          textarea.input { padding: 8px 12px; height: auto; min-height: 80px; }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children, required, full }) {
  return (
    <label className={"block " + (full ? "sm:col-span-2" : "")}>
      <span className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}
