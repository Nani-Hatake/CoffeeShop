import { useEffect, useState } from "react";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";

export default function StoreLocatorWeb() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listStores().then(setStores).finally(() => setLoading(false));
  }, []);

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Cafés near you</p>
          <h1 className="font-serif text-5xl text-primary mt-2 mb-12">A pour around the corner.</h1>

          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {stores.map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="aspect-[16/10] bg-surface-container-high overflow-hidden">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-primary leading-tight">{s.name}</h3>
                    <p className="text-on-surface-variant mt-2 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">
                        place
                      </span>
                      {s.address}
                    </p>
                    <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                        {s.distance_km.toFixed(1)} km
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        {s.hours}
                      </div>
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
