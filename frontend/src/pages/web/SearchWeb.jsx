import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function SearchWeb() {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api.listProducts({ q, category })
        .then((r) => !cancelled && setProducts(r))
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, category]);

  const onAdd = async (p) => {
    if (!user) {
      toast.push("Sign in to start a basket.", { tone: "error" });
      return;
    }
    try {
      await add(p.id, { quantity: 1, size: "Medium", milk: "Whole" });
      toast.push(`${p.name} added`, { tone: "success" });
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-5xl text-primary mb-2">Search & Discover</h1>
          <p className="text-on-surface-variant text-lg mb-8">Find your next favourite pour.</p>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              {/* Search */}
              <div className="mb-8">
                <label className="block">
                  <span className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block">
                    Search
                  </span>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      search
                    </span>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Yirgacheffe, oat milk…"
                      className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                    />
                  </div>
                </label>
              </div>

              {/* Categories */}
              <div>
                <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Category</p>
                <ul className="space-y-2 flex flex-col">
                  <button
                    onClick={() => setCategory(null)}
                    className={
                      "text-left px-3 py-2 rounded-lg transition " +
                      (!category
                        ? "bg-primary text-on-primary"
                        : "hover:bg-surface-container")
                    }
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.slug)}
                      className={
                        "text-left px-3 py-2 rounded-lg transition " +
                        (category === c.slug
                          ? "bg-primary text-on-primary"
                          : "hover:bg-surface-container")
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {loading ? (
                <p className="text-on-surface-variant">Searching…</p>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-[56px] text-outline">search_off</span>
                  <p className="text-on-surface-variant mt-4">No matches. Try a different word.</p>
                </div>
              ) : (
                <>
                  <p className="text-on-surface-variant mb-6">
                    {products.length} result{products.length === 1 ? "" : "s"}
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    {products.map((p) => (
                      <article key={p.id} className="group">
                        <Link to={`/product/${p.slug}`} className="block aspect-[3/4] overflow-hidden rounded-2xl mb-4">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high" />
                          )}
                        </Link>
                        <Link to={`/product/${p.slug}`}>
                          <h3 className="font-serif text-xl text-primary leading-tight">{p.name}</h3>
                        </Link>
                        <p className="text-on-surface-variant text-sm mt-1">{p.subtitle}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-serif text-xl text-primary">${p.price.toFixed(2)}</span>
                          <button
                            onClick={() => onAdd(p)}
                            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition"
                          >
                            <span className="material-symbols-outlined text-lg">add</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
