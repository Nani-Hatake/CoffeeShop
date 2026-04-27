import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function FavoritesWeb() {
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
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Your saved drinks</p>
          <h1 className="font-serif text-5xl text-primary mt-2 mb-12">A library of moments.</h1>

          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : favs.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <span className="material-symbols-outlined text-[72px] text-outline">favorite_border</span>
              <h2 className="font-serif text-3xl text-primary mt-6">No favourites yet</h2>
              <p className="text-on-surface-variant mt-3">
                Tap the heart on any drink to keep it close.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center px-8 h-12 rounded-full bg-primary text-on-primary font-medium mt-8 hover:opacity-90 transition"
              >
                Find a drink
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {favs.map((f) => (
                <article
                  key={f.id}
                  className="group rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden hover:shadow-lg transition"
                >
                  <Link to={`/product/${f.product.slug}`} className="block aspect-square relative">
                    {f.product.image_url && (
                      <img
                        src={f.product.image_url}
                        alt={f.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    )}
                  </Link>
                  <div className="p-5">
                    <Link to={`/product/${f.product.slug}`}>
                      <h3 className="font-serif text-xl leading-tight text-primary">{f.product.name}</h3>
                    </Link>
                    <p className="text-sm text-on-surface-variant mt-1">{f.product.subtitle}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-serif text-lg text-primary">${f.product.price.toFixed(2)}</span>
                      <button
                        onClick={() => remove(f.product.id)}
                        className="text-primary hover:text-error transition"
                        aria-label="Remove favourite"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </WebShell>
  );
}
