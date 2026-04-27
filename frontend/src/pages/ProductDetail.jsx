import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import MobileFrame from "../components/MobileFrame.jsx";
import WebShell from "../components/WebShell.jsx";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const SIZES = [
  { key: "Small",  ml: "8oz",  delta: -0.5 },
  { key: "Medium", ml: "12oz", delta: 0 },
  { key: "Large",  ml: "16oz", delta: 0.75 },
];
const MILKS = ["Whole", "Oat", "Almond", "Skim"];

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("Medium");
  const [milk, setMilk] = useState("Whole");
  const [favorite, setFavorite] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getProduct(slug)
      .then((p) => !cancelled && setProduct(p))
      .catch((e) => !cancelled && toast.push(e.message, { tone: "error" }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug, toast]);

  const sizeDelta = SIZES.find((s) => s.key === size)?.delta || 0;
  const price = product ? Number((product.price + sizeDelta).toFixed(2)) : 0;

  const toggleFav = async () => {
    if (!user) {
      toast.push("Sign in to save favourites.", { tone: "error" });
      return;
    }
    try {
      if (favorite) {
        await api.removeFavorite(product.id);
        setFavorite(false);
      } else {
        await api.addFavorite(product.id);
        setFavorite(true);
        toast.push("Saved to favourites");
      }
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const handleAdd = async () => {
    if (!user) {
      toast.push("Sign in to start a basket.", { tone: "error" });
      navigate("/sign-in");
      return;
    }
    setAdding(true);
    try {
      await add(product.id, { quantity: 1, size, milk });
      toast.push("Added to your bag", { tone: "success" });
      navigate("/cart");
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    } finally {
      setAdding(false);
    }
  };

  const isMobile = window.innerWidth < 1024;

  if (loading || !product) {
    return (
      <MobileFrame>
        <div className="h-screen flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        </div>
      </MobileFrame>
    );
  }

  return isMobile ? (
    <MobileFrame>
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          onClick={toggleFav}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow"
          aria-label="Toggle favourite"
        >
          <span
            className="material-symbols-outlined"
            style={favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>

        <div className="aspect-[4/5] bg-surface-container-high overflow-hidden">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      <div className="px-margin-mobile -mt-6 bg-background rounded-t-3xl relative pb-32 pt-6">
        {product.category && (
          <span className="inline-block text-label-sm uppercase tracking-widest text-on-surface-variant">
            {product.category.name}
          </span>
        )}
        <h1 className="font-serif text-[34px] leading-tight text-primary mt-1">{product.name}</h1>

        <div className="flex items-center gap-2 mt-2 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="font-medium text-primary">{product.rating?.toFixed(1)}</span>
          <span>· {product.review_count} reviews</span>
        </div>

        <p className="text-on-surface mt-4 text-body-md leading-relaxed">{product.description}</p>

        {product.tasting_notes && (
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Tag label="Origin" value={product.origin} />
            <Tag label="Roast" value={product.roast} />
            <Tag label="Notes" value={product.tasting_notes} />
          </div>
        )}

        <div className="mt-6">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Size</p>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSize(s.key)}
                className={
                  "py-3 rounded-xl border transition " +
                  (size === s.key
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-lowest text-on-surface border-outline-variant")
                }
              >
                <div className="font-serif text-lg leading-none">{s.key}</div>
                <div className="text-[11px] opacity-70 mt-1">{s.ml}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Milk</p>
          <div className="flex flex-wrap gap-2">
            {MILKS.map((m) => (
              <button
                key={m}
                onClick={() => setMilk(m)}
                className={
                  "px-4 py-2 rounded-full border text-sm transition " +
                  (milk === m
                    ? "bg-primary-container text-on-primary border-primary-container"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-30 bg-background/95 backdrop-blur border-t border-outline-variant px-margin-mobile py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Total</p>
            <p className="font-serif text-3xl text-primary">${price.toFixed(2)}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex-1 max-w-[60%] h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide active:scale-[.99] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            {adding ? "Adding…" : "Add to bag"}
          </button>
        </div>
        <Link
          to="/home"
          className="block text-center text-sm text-on-surface-variant mt-2 underline underline-offset-4"
        >
          Keep browsing
        </Link>
      </div>
    </MobileFrame>
  ) : (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/search" className="text-primary hover:opacity-80 transition mb-6 inline-flex items-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to menu
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image */}
            <div>
              <div className="aspect-[4/5] bg-surface-container-high rounded-2xl overflow-hidden mb-6">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <button
                onClick={toggleFav}
                className="w-full px-6 h-12 rounded-full border border-outline-variant text-primary font-medium hover:bg-surface-container-low transition inline-flex items-center justify-center gap-2"
              >
                <span
                  className="material-symbols-outlined"
                  style={favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                {favorite ? "Saved" : "Save to favorites"}
              </button>
            </div>

            {/* Details */}
            <div>
              {product.category && (
                <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">
                  {product.category.name}
                </span>
              )}
              <h1 className="font-serif text-5xl text-primary mt-2 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-3 mt-4 text-lg">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-medium text-primary">{product.rating?.toFixed(1)}</span>
                <span className="text-on-surface-variant">({product.review_count} reviews)</span>
              </div>

              <p className="text-lg text-on-surface mt-6 leading-relaxed">{product.description}</p>

              {product.tasting_notes && (
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <TagBig label="Origin" value={product.origin} />
                  <TagBig label="Roast" value={product.roast} />
                  <TagBig label="Tasting notes" value={product.tasting_notes} />
                </div>
              )}

              <div className="mt-8">
                <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Size</p>
                <div className="flex gap-2 mb-6">
                  {SIZES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSize(s.key)}
                      className={
                        "flex-1 py-2 rounded-lg border transition " +
                        (size === s.key
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container-lowest text-on-surface border-outline-variant")
                      }
                    >
                      <div className="text-sm font-medium">{s.key}</div>
                      <div className="text-xs opacity-70">{s.ml}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">Milk</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {MILKS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMilk(m)}
                      className={
                        "px-6 py-2 rounded-lg border text-sm transition " +
                        (milk === m
                          ? "bg-primary-container text-on-primary border-primary-container"
                          : "bg-surface-container-lowest text-on-surface-variant border-outline-variant")
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">shopping_bag</span>
                {adding ? "Adding…" : `Add to bag • $${price.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}

function TagBig({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-surface-container-low border border-outline-variant p-4">
      <p className="text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-lg text-primary mt-2 leading-tight">{value}</p>
    </div>
  );
}

function Tag({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-surface-container-low border border-outline-variant py-3 px-2">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-[13px] text-primary mt-1 leading-tight">{value}</p>
    </div>
  );
}
