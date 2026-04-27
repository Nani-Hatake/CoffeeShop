import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function HomeWeb() {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listCategories(), api.listProducts({ featured: true })])
      .then(([c, p]) => {
        setCategories(c);
        setProducts(p);
      })
      .finally(() => setLoading(false));
  }, []);

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
      {/* Hero */}
      <section
        className="relative py-20 px-6 bg-cover bg-center text-on-primary"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(39,19,16,0.85) 0%, rgba(39,19,16,0.7) 100%), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-label-sm uppercase tracking-widest opacity-80">Artisan Brew</p>
          <h1 className="font-serif text-6xl leading-tight mt-4 max-w-2xl mx-auto">
            Your morning ritual, <em className="text-primary-fixed">curated.</em>
          </h1>
          <p className="text-xl opacity-85 mt-6 max-w-2xl mx-auto">
            Single-origin pours, signature lattes, and a loyalty ritual designed for coffee people.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Link
              to="/search"
              className="px-8 h-12 rounded-full bg-on-primary text-primary font-medium inline-flex items-center justify-center hover:opacity-90 transition"
            >
              Browse menu
            </Link>
            <Link
              to="/loyalty"
              className="px-8 h-12 rounded-full border border-white/40 text-on-primary font-medium inline-flex items-center justify-center hover:bg-white/10 transition"
            >
              Earn rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Curated selection</p>
            <h2 className="font-serif text-5xl text-primary mt-2">Featured this week</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="aspect-[3/4] rounded-2xl bg-surface-container-high animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {products.slice(0, 4).map((p) => (
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
                    <h3 className="font-serif text-2xl text-primary leading-tight">{p.name}</h3>
                  </Link>
                  <p className="text-on-surface-variant mt-1">{p.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-serif text-2xl text-primary">${p.price.toFixed(2)}</span>
                    <button
                      onClick={() => onAdd(p)}
                      className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition"
                      aria-label={`Add ${p.name}`}
                    >
                      <span className="material-symbols-outlined">shopping_bag</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/search"
              className="px-8 h-12 rounded-full border border-primary text-primary font-medium inline-flex items-center justify-center hover:bg-primary hover:text-on-primary transition"
            >
              Explore all drinks
            </Link>
          </div>
        </div>
      </section>

      {/* Why Artisan Brew */}
      <section className="py-20 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-5xl text-primary text-center mb-16">Why Artisan Brew</h2>
          <div className="grid grid-cols-3 gap-8">
            <Feature
              icon="psychology"
              title="Single-origin expertise"
              desc="Every bean is sourced, roasted, and curated by our in-house masters."
            />
            <Feature
              icon="stars"
              title="Ritual rewards"
              desc="Earn points on every order and redeem for free drinks, classes, and more."
            />
            <Feature
              icon="local_cafe"
              title="Community spaces"
              desc="Three cafés across the city, each designed for connection and craft."
            />
          </div>
        </div>
      </section>
    </WebShell>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-serif text-2xl text-primary mb-2">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed">{desc}</p>
    </div>
  );
}
