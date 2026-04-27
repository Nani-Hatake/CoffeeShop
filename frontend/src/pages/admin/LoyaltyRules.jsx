import { useEffect, useState } from "react";

import AdminShell, { Section, StatCard } from "../../components/admin/AdminShell.jsx";
import { adminApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function LoyaltyRules() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [rules, setRules] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    adminApi.getLoyaltyRules().then((r) => { setRules(r); setForm(r); });
    adminApi.loyaltyStats().then(setStats);
  }, []);

  const update = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await adminApi.updateLoyaltyRules(form);
      setRules(r);
      toast.push("Loyalty rules saved", { tone: "success" });
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Loyalty rules"
      subtitle={isOwner ? "Owner controls" : "Read-only"}
    >
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon="stars" label="Points issued (active)"
            value={stats.total_points_issued.toLocaleString()} />
          <StatCard icon="redeem" label="Total redemptions" value={stats.total_redemptions} accent="tertiary" />
          <StatCard icon="trending_up" label="Active members" value={stats.active_members}
            delta={`${stats.redemption_rate} redemptions / member`} />
        </div>
      )}

      {!form ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : (
        <Section title="Earning & redemption rules">
          {!isOwner && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm">
              <span className="material-symbols-outlined align-middle mr-2 text-[18px]">lock</span>
              Loyalty rules are owner-controlled. You can view but not modify these settings.
            </div>
          )}
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <RuleField
              label="Points per dollar"
              value={form.points_per_dollar}
              step={0.1}
              onChange={update("points_per_dollar")}
              disabled={!isOwner}
              hint="How many ritual points are awarded per $1 spent."
            />
            <RuleField
              label="Redemption threshold"
              value={form.redemption_threshold}
              step={1}
              onChange={update("redemption_threshold")}
              disabled={!isOwner}
              hint="Minimum points required to redeem any reward."
            />
            <RuleField
              label="Welcome bonus"
              value={form.welcome_bonus}
              step={1}
              onChange={update("welcome_bonus")}
              disabled={!isOwner}
              hint="Points awarded to a new member on signup."
            />
            <RuleField
              label="Referral bonus"
              value={form.referral_bonus}
              step={1}
              onChange={update("referral_bonus")}
              disabled={!isOwner}
              hint="Bonus points when a friend signs up via referral."
            />

            {isOwner && (
              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-8 h-11 rounded-full bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save rules"}
                </button>
              </div>
            )}

            {rules && (
              <p className="sm:col-span-2 text-xs text-on-surface-variant pt-2">
                Last updated {new Date(rules.updated_at).toLocaleString()}
              </p>
            )}
          </form>
        </Section>
      )}
    </AdminShell>
  );
}

function RuleField({ label, value, onChange, step = 1, disabled = false, hint }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={0}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none disabled:opacity-60"
      />
      {hint && <span className="text-xs text-on-surface-variant mt-1 block">{hint}</span>}
    </label>
  );
}
