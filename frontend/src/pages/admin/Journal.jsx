import { useCallback, useEffect, useState } from "react";

import AdminShell, { Section } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

const EMPTY = {
  slug: "", title: "", excerpt: "", body: "",
  image_url: "", author: "", published: false,
};

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listJournal();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load journal entries");
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
        slug: form.slug, title: form.title, excerpt: form.excerpt,
        body: form.body, image_url: form.image_url, author: form.author,
        published: form.published,
      };
      if (form.id) {
        await adminApi.updateJournal(form.id, payload);
        toast.push("Entry updated", { tone: "success" });
      } else {
        await adminApi.createJournal(payload);
        toast.push("Entry created", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const remove = async (e) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    await adminApi.deleteJournal(e.id);
    toast.push("Entry deleted");
    load();
  };

  return (
    <AdminShell
      title="Brew Master's Journal"
      subtitle="Editorial"
      actions={
        <button
          onClick={() => setEditing(EMPTY)}
          className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New entry
        </button>
      }
    >
      <Section title={loading ? "Loading…" : `${entries.length} entries`}>
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
          <p className="text-on-surface-variant text-center py-8">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">No journal entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="flex gap-4 p-4 rounded-xl bg-surface-container-low">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                  {e.image_url && <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-xl text-primary truncate">{e.title}</h3>
                    <span className={
                      "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold " +
                      (e.published
                        ? "bg-tertiary-container text-on-tertiary"
                        : "bg-surface-container text-on-surface-variant")
                    }>
                      {e.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{e.excerpt}</p>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {e.author} · {e.published_at
                      ? `Published ${new Date(e.published_at).toLocaleDateString()}`
                      : `Created ${new Date(e.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditing(e)} className="text-primary hover:opacity-80" aria-label="Edit">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => remove(e)} className="text-on-surface-variant hover:text-error" aria-label="Delete">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {editing && <Editor entry={editing} onSave={save} onClose={() => setEditing(null)} />}
    </AdminShell>
  );
}

function Editor({ entry, onSave, onClose }) {
  const [form, setForm] = useState(entry);
  const update = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: value });
  };
  const submit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full mx-auto my-6 p-6">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-primary">
            {entry.id ? "Edit entry" : "New entry"}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </header>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.slug} onChange={update("slug")} placeholder="slug-with-dashes" required disabled={!!entry.id}
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none disabled:opacity-60" />
            <input value={form.author || ""} onChange={update("author")} placeholder="Author"
              className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          </div>
          <input value={form.title} onChange={update("title")} placeholder="Title" required
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          <input value={form.image_url || ""} onChange={update("image_url")} placeholder="Hero image URL"
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          <input value={form.excerpt || ""} onChange={update("excerpt")} placeholder="Short excerpt for the feed"
            className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
          <textarea value={form.body} onChange={update("body")} placeholder="Body — Markdown OK" required rows={10}
            className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none text-sm font-mono" />

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={update("published")} />
            Publish to mobile app
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-full border border-outline-variant text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              {entry.id ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
