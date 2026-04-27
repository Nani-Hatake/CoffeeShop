import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refresh = () => {
    setLoading(true);
    api.listFavorites().then(setFavs).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const remove = async (productId) => {
    try {
      await api.removeFavorite(productId);
      toast.push("Removed from favourites");
      refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  return (
    <AppShell title="Favourites" showBack>
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Your saved drinks</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">A library of moments.</h1>
      </section>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : favs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <span className="material-symbols-outlined text-[56px] text-outline">favorite_border</span>
          <h2 className="font-serif text-[24px] text-primary mt-4">No favourites yet</h2>
          <p className="text-on-surface-variant mt-2 max-w-[280px]">
            Tap the heart on any drink to keep it close.
          </p>
          <Link to="/home" className="mt-6 px-6 h-12 rounded-full bg-primary text-on-primary font-medium inline-flex items-center justify-center">
            Find a drink
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-gutter pb-6">
          {favs.map((f) => (
            <li key={f.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant">
              <Link to={`/product/${f.product.slug}`} className="block aspect-square bg-surface-container-high">
                {f.product.image_url && (
                  <img src={f.product.image_url} alt={f.product.name} className="w-full h-full object-cover" />
                )}
              </Link>
              <div className="p-3">
                <h3 className="font-serif text-[16px] leading-tight text-primary">{f.product.name}</h3>
                <p className="text-[11px] text-on-surface-variant mt-1">{f.product.subtitle}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-primary font-medium">${f.product.price.toFixed(2)}</span>
                  <button
                    onClick={() => remove(f.product.id)}
                    className="text-on-surface-variant hover:text-error"
                    aria-label="Remove favourite"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
