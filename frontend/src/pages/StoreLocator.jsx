import { useEffect, useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";

export default function StoreLocator() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listStores().then(setStores).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Find a café" showBack>
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Cafés near you</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">A pour around the corner.</h1>
      </section>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-3 pb-6">
          {stores.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden"
            >
              {s.image_url && (
                <img src={s.image_url} alt={s.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-serif text-[20px] text-primary leading-tight">{s.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{s.address}</p>
                <p className="text-[12px] text-on-surface-variant mt-2">
                  {s.distance_km.toFixed(1)} km · {s.hours}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
