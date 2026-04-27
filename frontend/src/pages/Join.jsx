import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MobileFrame from "../components/MobileFrame.jsx";
import AuthWebShell from "../components/AuthWebShell.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function Join() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();

  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(form);
      toast.push("Welcome to the ritual.");
      navigate("/verify-email", { replace: true, state: { email: form.email } });
    } catch (err) {
      toast.push(err.message || "Could not create account", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const formEl = (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Full name</span>
        <input
          required value={form.full_name} onChange={update("full_name")}
          className="mt-2 w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          placeholder="Mira Hale"
        />
      </label>
      <label className="block">
        <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Email</span>
        <input
          required type="email" value={form.email} onChange={update("email")}
          className="mt-2 w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          placeholder="you@artisan.coffee" autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Password</span>
        <input
          required type="password" minLength={6} value={form.password} onChange={update("password")}
          className="mt-2 w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          placeholder="At least 6 characters" autoComplete="new-password"
        />
      </label>
      <button
        type="submit" disabled={busy}
        className="mt-4 h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide hover:opacity-90 active:scale-[.99] transition disabled:opacity-60"
      >
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );

  if (!isMobile) {
    return (
      <AuthWebShell
        image="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1600&q=80"
        caption="Earn ritual points on every brew, save your favourite cup, and unlock seasonal pours."
      >
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Join the ritual</p>
        <h1 className="font-serif text-5xl text-primary mt-3 leading-tight">A seat at the bar.</h1>
        <p className="text-on-surface-variant mt-3">
          Earn ritual points on every brew, save your favourite cup, and unlock seasonal pours.
        </p>
        <div className="mt-10">{formEl}</div>
        <p className="mt-8 text-on-surface-variant text-center">
          Already have one?{" "}
          <Link to="/sign-in" className="text-primary underline underline-offset-4">Sign in</Link>
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
        <div className="mt-10">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Join the ritual</p>
          <h1 className="font-serif text-[40px] leading-tight text-primary mt-2">A seat at the bar.</h1>
          <p className="text-on-surface-variant mt-3">
            Earn ritual points on every brew, save your favourite cup, and unlock seasonal pours.
          </p>
        </div>
        <div className="mt-10">{formEl}</div>
        <p className="mt-auto text-center text-on-surface-variant pt-10">
          Already have one?{" "}
          <Link to="/sign-in" className="text-primary underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </MobileFrame>
  );
}
