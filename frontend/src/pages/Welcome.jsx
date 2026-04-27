import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import MobileFrame from "../components/MobileFrame.jsx";
import AuthWebShell from "../components/AuthWebShell.jsx";

function useIsMobile() {
  const [m, set] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => set(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

export default function Welcome() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <AuthWebShell caption="Single-origin pours, signature lattes, and a loyalty ritual designed for coffee people.">
        <p className="text-label-sm uppercase tracking-[0.3em] text-on-surface-variant">Artisan Brew</p>
        <h1 className="font-serif text-5xl text-primary mt-4 leading-tight">
          Your morning, <em className="text-secondary">curated.</em>
        </h1>
        <p className="text-on-surface-variant mt-5 text-lg">
          Order ahead, earn ritual points, save your favourite cup, and unlock seasonal pours.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            to="/join"
            className="h-12 rounded-full bg-primary text-on-primary font-medium tracking-wide flex items-center justify-center hover:opacity-90 transition"
          >
            Join the ritual
          </Link>
          <Link
            to="/sign-in"
            className="h-12 rounded-full border border-outline-variant text-primary font-medium tracking-wide flex items-center justify-center hover:bg-surface-container-low transition"
          >
            I already have an account
          </Link>
          <Link
            to="/home"
            className="text-on-surface-variant hover:text-primary underline underline-offset-4 text-sm mt-2 text-center"
          >
            Browse the menu first
          </Link>

          {/* Role hint for evaluators */}
          <div className="mt-8 pt-6 border-t border-outline-variant">
            <p className="text-[11px] uppercase tracking-[0.25em] text-on-surface-variant text-center mb-3">
              Three roles available
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <RoleHint icon="person" label="Customer" />
              <RoleHint icon="admin_panel_settings" label="Admin" />
              <RoleHint icon="verified_user" label="Owner" />
            </div>
            <Link
              to="/sign-in"
              className="block text-center text-xs text-primary underline underline-offset-4 mt-3"
            >
              See demo accounts on the sign-in page →
            </Link>
          </div>
        </div>
      </AuthWebShell>
    );
  }

  // Mobile (immersive full-bleed)
  return (
    <MobileFrame>
      <section
        className="relative min-h-screen flex flex-col justify-end px-margin-mobile pb-12 pt-md"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(39,19,16,0.0) 30%, rgba(39,19,16,0.85) 100%), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center text-on-primary">
          <p className="text-label-sm uppercase tracking-[0.4em] opacity-80">Artisan Brew</p>
          <h1 className="font-serif text-[44px] leading-[1.05] mt-3">
            Your morning, <em className="text-primary-fixed">curated.</em>
          </h1>
          <p className="text-body-md opacity-85 mt-4 max-w-[320px] mx-auto">
            Single-origin pours, signature lattes, and a loyalty ritual designed for coffee people.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <Link to="/join" className="h-12 rounded-full bg-on-primary text-primary font-medium tracking-wide flex items-center justify-center">
              Join the ritual
            </Link>
            <Link to="/sign-in" className="h-12 rounded-full border border-white/40 text-on-primary font-medium tracking-wide flex items-center justify-center">
              I already have an account
            </Link>
            <Link to="/home" className="text-on-primary/70 underline underline-offset-4 text-sm mt-2">
              Browse the menu first
            </Link>
            <p className="text-on-primary/60 text-[11px] uppercase tracking-[0.25em] mt-6">
              Customer · Admin · Owner accounts available on sign-in
            </p>
          </div>
        </div>
      </section>
    </MobileFrame>
  );
}

function RoleHint({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-surface-container-low">
      <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
        {label}
      </span>
    </div>
  );
}
