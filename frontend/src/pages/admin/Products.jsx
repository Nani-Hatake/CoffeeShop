import { useEffect, useMemo, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

const EMPTY = {
  slug: "", name: "", subtitle: "", description: "",
  category_id: null, price: 0, image_url: "",
  origin: "", roast: "", process: "", altitude: "", tasting_notes: "",
  is_featured: false, is_seasonal: false, is_limited: false, is_available: true,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | EMPTY | product
  const toast = useToast();

  const refresh = () => {
    setLoading(true);
    Promise.all([adminApi.listProducts(), adminApi.listCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const onSave = async (form) => {
    try {
      if (form.id) {
        await adminApi.updateProduct(form.id, form);
        toast.push("Product updated", { tone: "success" });
      } else {
        await adminApi.createProduct(form);
        toast.push("Product created", { tone: "success" });
      }
      setEditing(null);
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const onDelete = async (p) => {
    if (!confirm(`Delete ${p.name}? This also removes related stock and batches.`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      toast.push("Product deleted");
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const onToggle = async (p) => {
    try {
      await adminApi.toggleAvailability(p.id);
      toast.push(`${p.name} is now ${!p.is_available ? "available" : "unavailable"}`);
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AdminShell
      title="Catalog"
      subtitle="Roast management"
      actions={
        <button
          onClick={() => setEditing({ ...EMPTY, category_id: categories[0]?.id })}
          className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New product
        </button>
      }
    >
      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <Section title={`${products.length} products`}>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Tags</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                          {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-on-surface-variant">{p.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-on-surface-variant">{p.category?.name}</td>
                    <td className="px-3 py-3 font-medium">${p.price.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.is_featured && <Tag>Featured</Tag>}
                        {p.is_seasonal && <Tag>Seasonal</Tag>}
                        {p.is_limited && <Tag>Limited</Tag>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onToggle(p)}
                        className={
                          "px-3 py-1 rounded-full text-[11px] tracking-widest uppercase font-semibold transition " +
                          (p.is_available
                            ? "bg-tertiary-container text-on-tertiary"
                            : "bg-error-container text-on-error-container")
                        }
                      >
                        {p.is_available ? "On menu" : "86'd"}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="text-primary hover:opacity-80 mr-3"
                        aria-label="Edit"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="text-on-surface-variant hover:text-error"
                        aria-label="Delete"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}
    </AdminShell>
  );
}

function Tag({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant">
      {children}
    </span>
  );
}

function ProductEditor({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState(product);
  const [batches, setBatches] = useState([]);
  const [batchForm, setBatchForm] = useState({ batch_number: "", roast_date: "", best_by: "", qty: 0, notes: "" });
  const toast = useToast();

  const isNew = !product.id;
  const update = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked
      : e.target.type === "number" ? Number(e.target.value)
      : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  useEffect(() => {
    if (!isNew) {
      adminApi.listBatches(product.id).then(setBatches);
    }
  }, [product.id, isNew]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, category_id: form.category_id || categories[0]?.id });
  };

  const addBatch = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createBatch({
        product_id: product.id,
        batch_number: batchForm.batch_number,
        roast_date: batchForm.roast_date || null,
        best_by: batchForm.best_by || null,
        qty: Number(batchForm.qty) || 0,
        notes: batchForm.notes,
      });
      toast.push("Batch logged");
      setBatchForm({ batch_number: "", roast_date: "", best_by: "", qty: 0, notes: "" });
      adminApi.listBatches(product.id).then(setBatches);
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const deleteBatch = async (b) => {
    await adminApi.deleteBatch(b.id);
    adminApi.listBatches(product.id).then(setBatches);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full my-6">
          <header className="flex justify-between items-center p-6 border-b border-outline-variant">
            <h3 className="font-serif text-2xl text-primary">
              {isNew ? "New product" : `Edit · ${product.name}`}
            </h3>
            <button onClick={onClose} className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <form onSubmit={submit} className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Slug" required>
                <input value={form.slug} onChange={update("slug")} required disabled={!isNew}
                  className="input-base disabled:bg-surface-container-low" />
              </Field>
              <Field label="Name" required>
                <input value={form.name} onChange={update("name")} required className="input-base" />
              </Field>
              <Field label="Subtitle" full>
                <input value={form.subtitle || ""} onChange={update("subtitle")} className="input-base" />
              </Field>
              <Field label="Category">
                <select value={form.category_id || ""} onChange={update("category_id")} className="input-base">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Price (USD)" required>
                <input type="number" step="0.05" value={form.price} onChange={update("price")} required className="input-base" />
              </Field>
              <Field label="Image URL" full>
                <input value={form.image_url || ""} onChange={update("image_url")} className="input-base" />
              </Field>
              <Field label="Description" full>
                <textarea value={form.description || ""} onChange={update("description")} rows={3} className="input-base" />
              </Field>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">Sensory profile</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Origin">
                  <input value={form.origin || ""} onChange={update("origin")} className="input-base" />
                </Field>
                <Field label="Roast">
                  <input value={form.roast || ""} onChange={update("roast")} className="input-base" />
                </Field>
                <Field label="Process">
                  <input value={form.process || ""} onChange={update("process")} placeholder="Washed, Natural, Honey…" className="input-base" />
                </Field>
                <Field label="Altitude">
                  <input value={form.altitude || ""} onChange={update("altitude")} placeholder="1800-2100 MASL" className="input-base" />
                </Field>
                <Field label="Tasting notes" full>
                  <input value={form.tasting_notes || ""} onChange={update("tasting_notes")} placeholder="Dark chocolate, cherry, cedar" className="input-base" />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">Storefront flags</p>
              <div className="flex flex-wrap gap-3">
                <Toggle label="Featured" checked={form.is_featured} onChange={update("is_featured")} />
                <Toggle label="Seasonal" checked={form.is_seasonal} onChange={update("is_seasonal")} />
                <Toggle label="Limited edition" checked={form.is_limited} onChange={update("is_limited")} />
                <Toggle label="Available" checked={form.is_available} onChange={update("is_available")} />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-outline-variant">
              <button type="button" onClick={onClose}
                className="flex-1 h-12 rounded-full border border-outline-variant text-on-surface text-sm">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 h-12 rounded-full bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition">
                {isNew ? "Create product" : "Save changes"}
              </button>
            </div>
          </form>

          {!isNew && (
            <div className="border-t border-outline-variant p-6">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">
                Batch tracking
              </p>
              <ul className="space-y-2 mb-4">
                {batches.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No batches logged yet.</p>
                )}
                {batches.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low text-sm">
                    <span className="font-mono font-semibold text-primary">{b.batch_number}</span>
                    <span className="text-on-surface-variant">
                      {b.roast_date && `Roasted ${new Date(b.roast_date).toLocaleDateString()}`}
                      {b.best_by && ` · Best by ${new Date(b.best_by).toLocaleDateString()}`}
                    </span>
                    <span className="ml-auto text-on-surface-variant">{b.qty} units</span>
                    <button onClick={() => deleteBatch(b)} className="text-on-surface-variant hover:text-error">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </li>
                ))}
              </ul>

              <form onSubmit={addBatch} className="grid sm:grid-cols-5 gap-2">
                <input value={batchForm.batch_number} onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                  placeholder="Batch #" required className="input-base" />
                <input type="date" value={batchForm.roast_date} onChange={(e) => setBatchForm({ ...batchForm, roast_date: e.target.value })}
                  placeholder="Roast date" className="input-base" />
                <input type="date" value={batchForm.best_by} onChange={(e) => setBatchForm({ ...batchForm, best_by: e.target.value })}
                  placeholder="Best by" className="input-base" />
                <input type="number" value={batchForm.qty} onChange={(e) => setBatchForm({ ...batchForm, qty: e.target.value })}
                  placeholder="Qty" className="input-base" />
                <button type="submit" className="h-10 rounded-lg bg-primary text-on-primary text-sm font-medium">
                  Log
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 8px;
          background: #fff1e4;
          border: 1px solid #d3c3c0;
          outline: none;
        }
        .input-base:focus { border-color: #271310; }
        textarea.input-base { padding: 8px 12px; height: auto; min-height: 80px; }
      `}</style>
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

function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded" />
      <span className="text-sm text-on-surface">{label}</span>
    </label>
  );
}
