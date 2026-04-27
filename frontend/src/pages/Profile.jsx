import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const ITEMS = [
  { to: "/orders",        icon: "receipt_long", label: "Order history" },
  { to: "/favorites",     icon: "favorite",     label: "Favourites" },
  { to: "/loyalty",       icon: "stars",        label: "Loyalty & rewards" },
  { to: "/subscriptions", icon: "autorenew",    label: "Subscriptions" },
  { to: "/notifications", icon: "notifications", label: "Notifications" },
  { to: "/stores",        icon: "place",        label: "Find a café" },
  { to: "/master-class",  icon: "school",       label: "Roast Master Class" },
  { to: "/brew-journal",  icon: "menu_book",    label: "Brew journal" },
  { to: "/gifts",         icon: "redeem",       label: "Gift a ritual" },
  { to: "/referrals",     icon: "card_giftcard", label: "Refer a friend" },
  { to: "/settings",      icon: "settings",     label: "Settings" },
  { to: "/help",          icon: "help",         label: "Help & support" },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell title="Profile">
      <section className="py-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif text-2xl">
            {(user?.full_name || "A").trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-[24px] text-primary leading-tight">
              {user?.full_name || "Anonymous"}
            </h1>
            <p className="text-on-surface-variant text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Tier" value={user?.tier || "—"} />
          <Stat label="Points" value={user?.points ?? 0} />
          <Stat label="Status" value={user?.is_verified ? "Verified" : "Unverified"} />
        </div>
      </section>

      <ul className="flex flex-col divide-y divide-outline-variant rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="flex items-center gap-4 px-4 h-14 hover:bg-surface-container-low transition"
            >
              <span className="material-symbols-outlined text-primary">{it.icon}</span>
              <span className="flex-1 text-on-surface">{it.label}</span>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={() => { logout(); navigate("/welcome"); }}
        className="mt-6 mb-4 w-full h-12 rounded-full border border-outline-variant text-primary font-medium tracking-wide inline-flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">logout</span>
        Sign out
      </button>
    </AppShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-[18px] text-primary mt-0.5">{value}</p>
    </div>
  );
}
