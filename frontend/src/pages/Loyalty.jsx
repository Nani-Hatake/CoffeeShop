import { useEffect, useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const TIER_TARGETS = { Apprentice: 250, Connoisseur: 600, Master: 1200 };

export default function Loyalty() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api.listRewards().then(setRewards);
    api.listRedemptions().then(setRedemptions);
  };
  useEffect(load, []);

  const redeem = async (r) => {
    setBusyId(r.id);
    try {
      const red = await api.redeem(r.id);
      toast.push(`Reward ready · ${red.code}`, { tone: "success" });
      load();
      await refresh();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const points = user?.points ?? 0;
  const target = TIER_TARGETS[user?.tier] || 250;
  const pct = Math.min(100, Math.round((points / target) * 100));

  return (
    <AppShell title="Loyalty & rewards" showBack>
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Ritual loyalty</p>
        <h1 className="font-serif text-[34px] text-primary mt-1 leading-tight">
          {points} <span className="text-on-surface-variant text-2xl">pts</span>
        </h1>
        <p className="text-on-surface-variant mt-1">{user?.tier} tier</p>

        <div className="mt-4 h-3 rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] text-on-surface-variant mt-2">
          {Math.max(0, target - points)} pts to next reward tier
        </p>
      </section>

      <h2 className="font-serif text-[22px] text-primary mt-2 mb-3">Available rewards</h2>
      <ul className="flex flex-col gap-3">
        {rewards.map((r) => {
          const canRedeem = points >= r.cost_points;
          return (
            <li
              key={r.id}
              className="flex gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                {r.image_url && <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-[18px] text-primary leading-tight">{r.title}</h3>
                <p className="text-sm text-on-surface-variant">{r.description}</p>
              </div>
              <button
                disabled={!canRedeem || busyId === r.id}
                onClick={() => redeem(r)}
                className={
                  "self-center px-4 h-10 rounded-full text-sm font-medium tracking-wide " +
                  (canRedeem
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant")
                }
              >
                {busyId === r.id ? "…" : `${r.cost_points} pts`}
              </button>
            </li>
          );
        })}
      </ul>

      {redemptions.length > 0 && (
        <>
          <h2 className="font-serif text-[22px] text-primary mt-8 mb-3">Your redemption codes</h2>
          <ul className="flex flex-col gap-2 pb-6">
            {redemptions.map((r) => (
              <li key={r.id} className="rounded-2xl bg-tertiary-container text-on-tertiary p-4 flex justify-between items-center">
                <div>
                  <p className="font-serif text-[18px]">{r.reward.title}</p>
                  <p className="text-[11px] uppercase tracking-widest opacity-80 mt-1">
                    {new Date(r.redeemed_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-mono text-lg tracking-widest">{r.code}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  );
}
