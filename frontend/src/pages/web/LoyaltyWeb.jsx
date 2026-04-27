import { useEffect, useState } from "react";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

const TIER_TARGETS = { Apprentice: 250, Connoisseur: 600, Master: 1200 };

export default function LoyaltyWeb() {
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
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-container text-on-primary p-12 mb-16 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-on-primary/5" />
            <div className="absolute bottom-0 right-12 opacity-10">
              <span className="material-symbols-outlined text-[180px]">local_cafe</span>
            </div>
            <div className="relative z-10 max-w-2xl">
              <p className="text-label-sm uppercase tracking-[0.3em] opacity-80">Ritual loyalty</p>
              <div className="flex items-end gap-3 mt-4">
                <span className="font-serif text-7xl">{points}</span>
                <span className="font-serif text-3xl opacity-70 mb-3">pts</span>
              </div>
              <p className="opacity-80 mt-2">{user?.tier} tier</p>

              <div className="mt-6 h-3 rounded-full bg-on-primary/20 overflow-hidden max-w-md">
                <div className="h-full bg-on-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm opacity-75 mt-3">
                {Math.max(0, target - points)} pts to next reward tier
              </p>
            </div>
          </div>

          {/* Available rewards */}
          <div className="mb-16">
            <h2 className="font-serif text-4xl text-primary mb-8">Available rewards</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {rewards.map((r) => {
                const canRedeem = points >= r.cost_points;
                return (
                  <article
                    key={r.id}
                    className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden flex flex-col"
                  >
                    <div className="aspect-square bg-surface-container-high">
                      {r.image_url && (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-serif text-xl text-primary leading-tight">{r.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-2 flex-1">{r.description}</p>
                      <button
                        disabled={!canRedeem || busyId === r.id}
                        onClick={() => redeem(r)}
                        className={
                          "mt-4 h-11 rounded-full text-sm font-medium tracking-wide transition " +
                          (canRedeem
                            ? "bg-primary text-on-primary hover:opacity-90"
                            : "bg-surface-container-high text-on-surface-variant cursor-not-allowed")
                        }
                      >
                        {busyId === r.id ? "Redeeming…" : `Redeem · ${r.cost_points} pts`}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Redemption codes */}
          {redemptions.length > 0 && (
            <div>
              <h2 className="font-serif text-4xl text-primary mb-8">Your redemption codes</h2>
              <div className="grid grid-cols-2 gap-4">
                {redemptions.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-tertiary-container text-on-tertiary p-6 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-serif text-2xl">{r.reward.title}</p>
                      <p className="text-xs uppercase tracking-widest opacity-80 mt-2">
                        {new Date(r.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-mono text-2xl tracking-widest">{r.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </WebShell>
  );
}
