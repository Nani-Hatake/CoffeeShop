import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MobileFrame from "../components/MobileFrame.jsx";
import AuthWebShell from "../components/AuthWebShell.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const DEMO_ACCOUNTS = [
  {
    role: "customer",
    label: "Customer",
    icon: "person",
    email: "barista@artisan.coffee",
    password: "ritual123",
    description: "Browse, order, earn ritual points",
    landing: "/home",
    accent: "bg-secondary-container text-on-secondary-container",
  },
  {
    role: "admin",
    label: "Admin",
    icon: "admin_panel_settings",
    email: "admin@artisan.coffee",
    password: "espresso",
    description: "Head Roaster · catalog, orders, inventory",
    landing: "/admin",
    accent: "bg-tertiary-container text-on-tertiary",
  },
  {
    role: "owner",
    label: "Owner",
    icon: "verified_user",
    email: "owner@artisan.coffee",
    password: "strategy",
    description: "Business Strategist · loyalty rules + everything",
    landing: "/admin",
    accent: "bg-primary-container text-on-primary",
  },
];

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("barista@artisan.coffee");
  const [password, setPassword] = useState("ritual123");
  const [busy, setBusy] = useState(false);
  const [activeRole, setActiveRole] = useState("customer");

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setActiveRole(account.role);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const me = await login(email, password);
      toast.push("Welcome back.");
      // Land admins/owners on the Atelier panel; customers on the storefront.
      const dest =
        me?.role === "admin" || me?.role === "owner" ? "/admin" : "/home";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.push(err.message || "Sign in failed", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const demoPanel = (
    <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-on-surface-variant font-semibold mb-3">
        Demo accounts · tap to fill
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.role}
            type="button"
            onClick={() => fillDemo(acc)}
            className={
              "text-left p-3 rounded-xl border transition flex items-start gap-3 " +
              (activeRole === acc.role
                ? "border-primary bg-white shadow-[0_4px_12px_rgba(39,19,16,0.10)]"
                : "border-outline-variant bg-white/60 hover:border-primary hover:bg-white")
            }
          >
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${acc.accent}`}
            >
              <span className="material-symbols-outlined text-[20px]">{acc.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base text-primary leading-tight">
                {acc.label}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                {acc.description}
              </p>
            </div>
            {activeRole === acc.role && (
              <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                check_circle
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const form = (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Email</span>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          placeholder="you@artisan.coffee" autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Password</span>
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          autoComplete="current-password"
        />
      </label>

      <button
        type="submit" disabled={busy}
        className="mt-4 h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide active:scale-[.99] hover:opacity-90 transition disabled:opacity-60"
      >
        {busy ? "Signing in…" : `Sign in${activeRole !== "customer" ? ` as ${activeRole}` : ""}`}
      </button>
    </form>
  );

  if (!isMobile) {
    return (
      <AuthWebShell
        image="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1600&q=80"
        caption="Welcome back. Your saved drinks, points, and orders are right here."
      >
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Sign in</p>
        <h1 className="font-serif text-5xl text-primary mt-3 leading-tight">Welcome back.</h1>
        <p className="text-on-surface-variant mt-3">
          Three roles, one app. Pick a demo profile or use your own credentials.
        </p>

        <div className="mt-6">{demoPanel}</div>
        <div className="mt-6">{form}</div>

        <p className="mt-8 text-on-surface-variant text-center">
          New here?{" "}
          <Link to="/join" className="text-primary underline underline-offset-4">Create an account</Link>
        </p>
      </AuthWebShell>
    );
  }

  return (
    <MobileFrame>
      <div className="px-margin-mobile pt-12 pb-10 min-h-screen flex flex-col">
        <Link to="/welcome" className="text-primary inline-flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </Link>
        <div className="mt-8">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Sign in</p>
          <h1 className="font-serif text-[40px] leading-tight text-primary mt-2">Welcome back.</h1>
          <p className="text-on-surface-variant mt-3">
            Three roles, one app. Tap a demo profile to autofill.
          </p>
        </div>

        <div className="mt-6">{demoPanel}</div>
        <div className="mt-6">{form}</div>

        <p className="mt-auto text-center text-on-surface-variant pt-10">
          New here?{" "}
          <Link to="/join" className="text-primary underline underline-offset-4">Create an account</Link>
        </p>
      </div>
    </MobileFrame>
  );
}
