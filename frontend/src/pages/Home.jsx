import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listCategories(), api.listProducts()])
      .then(([c, p]) => {
        if (cancelled) return;
        setCategories(c);
        setProducts(p);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    if (!active) return products;
    return products.filter((p) => p.category?.slug === active);
  }, [products, active]);

  const onAdd = async (p) => {
    if (!user) {
      toast.push("Sign in to start a basket.", { tone: "error" });
      return;
    }
    try {
      await add(p.id, { quantity: 1, size: "Medium", milk: "Whole" });
      toast.push(`${p.name} added`, { tone: "success" });
    } catch (err) {
      toast.push(err.message || "Could not add to cart", { tone: "error" });
    }
  };

  return (
    <AppShell>
      <section className="py-lg">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          {greeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary mt-xs">
          Curating your morning ritual.
        </h1>
      </section>

      <section className="mb-lg">
        <Link to="/search" className="relative group block">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <div className="w-full h-[56px] pl-[52px] pr-md bg-surface-container-low border border-outline-variant rounded-xl flex items-center text-on-surface-variant">
            Search our signature blends&hellip;
          </div>
        </Link>
      </section>

      <section className="mb-lg -mx-margin-mobile overflow-x-auto no-scrollbar flex gap-sm px-margin-mobile">
        <button
          onClick={() => setActive(null)}
          className={
            "flex-shrink-0 px-lg py-sm rounded-full font-label-md text-label-md transition-all active:scale-95 " +
            (!active
              ? "bg-primary-container text-on-primary"
              : "bg-surface-container-highest text-on-surface-variant")
          }
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.slug)}
            className={
              "flex-shrink-0 px-lg py-sm rounded-full font-label-md text-label-md transition-all active:scale-95 " +
              (active === c.slug
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container-highest text-on-surface-variant")
            }
          >
            {c.name}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-gutter pb-lg">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="aspect-[3/4] rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-gutter pb-lg">
          {visible.map((p) => (
            <article
              key={p.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(62,39,35,0.05)] flex flex-col"
            >
              <Link to={`/product/${p.slug}`} className="aspect-square block overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-container-high" />
                )}
              </Link>
              <div className="p-md flex flex-col flex-1">
                <Link to={`/product/${p.slug}`}>
                  <h3 className="font-headline-md text-[16px] leading-tight text-primary">
                    {p.name}
                  </h3>
                </Link>
                <p className="font-body-md text-label-sm text-on-surface-variant mt-xs">
                  {p.subtitle}
                </p>
                <div className="mt-auto pt-sm flex justify-between items-center">
                  <span className="font-label-md text-label-md text-primary">
                    ${p.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onAdd(p)}
                    className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center active:scale-90 transition"
                    aria-label={`Add ${p.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <p className="col-span-2 text-center text-on-surface-variant py-12">
              No drinks in this category yet.
            </p>
          )}
        </section>
      )}
    </AppShell>
  );
}
