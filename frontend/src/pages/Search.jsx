import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api.listProducts({ q })
        .then((r) => !cancelled && setResults(r))
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  return (
    <AppShell title="Search">
      <section className="py-lg">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          Search & Discovery
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary mt-xs">
          Find your next pour.
        </h1>
      </section>

      <div className="relative mb-lg">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
          search
        </span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try ‘Yirgacheffe’, ‘oat milk’, ‘cold brew’"
          className="w-full h-[56px] pl-[52px] pr-md rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
        />
      </div>

      {loading && results.length === 0 ? (
        <p className="text-on-surface-variant">Searching…</p>
      ) : results.length === 0 ? (
        <div className="py-12 text-center">
          <span className="material-symbols-outlined text-[40px] text-outline">search_off</span>
          <p className="text-on-surface-variant mt-2">No matches. Try a different word.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                to={`/product/${p.slug}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[18px] leading-tight text-primary">{p.name}</h3>
                  <p className="text-label-sm text-on-surface-variant truncate">{p.subtitle}</p>
                </div>
                <span className="text-label-md text-primary">${p.price.toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
