import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import WebShell from "../components/WebShell.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const STORAGE_KEY = "artisan_brew_prefs";

const DEFAULT_PREFS = {
  notify_order_updates: true,
  notify_promotions: true,
  notify_roast_drops: true,
  notify_email: true,
  default_size: "Medium",
  default_milk: "Whole",
  language: "en",
  theme: "light",
  reduce_motion: false,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export default function Settings() {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const update = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  const reset = () => {
    if (!confirm("Reset all preferences to defaults?")) return;
    setPrefs({ ...DEFAULT_PREFS });
    savePrefs(DEFAULT_PREFS);
    toast.push("Preferences reset");
  };

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  // ----- Section content (shared between mobile & web) -----
  const accountSection = (
    <Group title="Account" icon="person">
      <Row label="Full name" value={user?.full_name || "—"} />
      <Row label="Email" value={user?.email || "—"} />
      <Row label="Tier" value={user?.tier || "—"} />
      <Row
        label="Loyalty points"
        value={user?.points ?? 0}
        action={
          <Link to="/loyalty" className="text-sm text-primary underline underline-offset-4">
            Manage
          </Link>
        }
      />
      <Row
        label="Email verified"
        value={user?.is_verified ? "Yes" : "Not yet"}
        action={
          !user?.is_verified && (
            <Link to="/verify-email" className="text-sm text-primary underline underline-offset-4">
              Verify
            </Link>
          )
        }
      />
    </Group>
  );

  const notificationsSection = (
    <Group title="Notifications" icon="notifications">
      <Toggle
        label="Order updates"
        description="Brewing, ready for pickup, refunds"
        value={prefs.notify_order_updates}
        onChange={(v) => update("notify_order_updates", v)}
      />
      <Toggle
        label="Promotions & seasonal drops"
        description="Limited-edition launches and discount codes"
        value={prefs.notify_promotions}
        onChange={(v) => update("notify_promotions", v)}
      />
      <Toggle
        label="New roast alerts"
        description="When a single-origin we recommend ships"
        value={prefs.notify_roast_drops}
        onChange={(v) => update("notify_roast_drops", v)}
      />
      <Toggle
        label="Email me too"
        description="Mirror push notifications to email"
        value={prefs.notify_email}
        onChange={(v) => update("notify_email", v)}
      />
    </Group>
  );

  const preferencesSection = (
    <Group title="Brew preferences" icon="local_cafe">
      <SelectRow
        label="Default size"
        value={prefs.default_size}
        onChange={(v) => update("default_size", v)}
        options={["Small", "Medium", "Large"]}
      />
      <SelectRow
        label="Default milk"
        value={prefs.default_milk}
        onChange={(v) => update("default_milk", v)}
        options={["Whole", "Oat", "Almond", "Skim"]}
      />
      <SelectRow
        label="Language"
        value={prefs.language}
        onChange={(v) => update("language", v)}
        options={[
          { v: "en", l: "English" },
          { v: "es", l: "Español" },
          { v: "fr", l: "Français" },
        ]}
      />
      <SelectRow
        label="Theme"
        value={prefs.theme}
        onChange={(v) => update("theme", v)}
        options={[
          { v: "light", l: "Cream (light)" },
          { v: "dark",  l: "Espresso (dark)" },
          { v: "auto",  l: "Match system" },
        ]}
      />
      <Toggle
        label="Reduce motion"
        description="Minimise animation transitions"
        value={prefs.reduce_motion}
        onChange={(v) => update("reduce_motion", v)}
      />
    </Group>
  );

  const privacySection = (
    <Group title="Privacy & data" icon="shield">
      <RowButton
        label="Download my data"
        description="Export your orders, favourites, and points history"
        onClick={() => toast.push("We'll email you a JSON export within 24 hours.")}
      />
      <RowButton
        label="Clear cached preferences"
        description="Reset toggles and defaults on this device"
        onClick={reset}
      />
      <RowButton
        label="Delete account"
        description="Permanently remove your account and order history"
        tone="danger"
        onClick={() => toast.push("Contact support@artisan.coffee to action this.", { tone: "error" })}
      />
    </Group>
  );

  const aboutSection = (
    <Group title="About" icon="info">
      <Row label="App version" value="1.0.0" />
      <Row label="API version" value="2.0.0" />
      <Row
        label="Terms of service"
        action={<a href="#" className="text-sm text-primary underline underline-offset-4">Read</a>}
      />
      <Row
        label="Privacy policy"
        action={<a href="#" className="text-sm text-primary underline underline-offset-4">Read</a>}
      />
      <Row
        label="Open-source licences"
        action={<a href="#" className="text-sm text-primary underline underline-offset-4">View</a>}
      />
    </Group>
  );

  if (isMobile) {
    return (
      <AppShell title="Settings" showBack>
        <section className="py-lg">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Preferences</p>
          <h1 className="font-serif text-[28px] text-primary mt-1">Tune your ritual.</h1>
        </section>

        <div className="space-y-4 pb-4">
          {accountSection}
          {notificationsSection}
          {preferencesSection}
          {privacySection}
          {aboutSection}

          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-full border border-outline-variant text-primary font-medium inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
        </div>
      </AppShell>
    );
  }

  // Desktop layout: sidebar of sections + scrolling content
  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Preferences</p>
          <h1 className="font-serif text-5xl text-primary mt-2 mb-12">Tune your ritual.</h1>

          <div className="grid lg:grid-cols-[220px_1fr] gap-8">
            {/* Section anchor sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ul className="space-y-1 text-sm">
                <SideAnchor href="#account" icon="person" label="Account" />
                <SideAnchor href="#notifications" icon="notifications" label="Notifications" />
                <SideAnchor href="#preferences" icon="local_cafe" label="Preferences" />
                <SideAnchor href="#privacy" icon="shield" label="Privacy" />
                <SideAnchor href="#about" icon="info" label="About" />
              </ul>
              <button
                onClick={handleLogout}
                className="mt-6 w-full h-11 rounded-full border border-outline-variant text-primary font-medium inline-flex items-center justify-center gap-2 hover:bg-surface-container-low transition"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </aside>

            {/* Sections */}
            <div className="space-y-6 max-w-2xl">
              <div id="account" className="scroll-mt-24">{accountSection}</div>
              <div id="notifications" className="scroll-mt-24">{notificationsSection}</div>
              <div id="preferences" className="scroll-mt-24">{preferencesSection}</div>
              <div id="privacy" className="scroll-mt-24">{privacySection}</div>
              <div id="about" className="scroll-mt-24">{aboutSection}</div>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}

// ---------- Building blocks ----------

function Group({ title, icon, children }) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="font-serif text-lg text-primary">{title}</h2>
      </header>
      <div className="divide-y divide-outline-variant">{children}</div>
    </section>
  );
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm text-on-surface-variant">{label}</p>
        {value !== undefined && <p className="text-on-surface mt-0.5 truncate">{value}</p>}
      </div>
      {action}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 px-5 py-3 cursor-pointer hover:bg-surface-container-low transition">
      <div className="min-w-0 flex-1">
        <p className="text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      <span
        className={
          "relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 " +
          (value ? "bg-primary" : "bg-outline-variant")
        }
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " +
            (value ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </span>
    </label>
  );
}

function SelectRow({ label, value, onChange, options }) {
  const opts = options.map((o) =>
    typeof o === "string" ? { v: o, l: o } : o
  );
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <p className="text-on-surface">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none text-sm focus:border-primary"
      >
        {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function RowButton({ label, description, onClick, tone = "default" }) {
  const labelClass =
    tone === "danger"
      ? "text-error font-medium"
      : "text-on-surface";
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3 hover:bg-surface-container-low transition flex items-center justify-between gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className={labelClass}>{label}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
      </div>
      <span className={"material-symbols-outlined " + (tone === "danger" ? "text-error" : "text-outline")}>
        chevron_right
      </span>
    </button>
  );
}

function SideAnchor({ href, icon, label }) {
  return (
    <li>
      <a
        href={href}
        className="flex items-center gap-3 px-3 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition"
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        {label}
      </a>
    </li>
  );
}
