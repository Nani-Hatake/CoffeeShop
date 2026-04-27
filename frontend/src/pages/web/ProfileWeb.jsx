import { Link, useNavigate } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const ITEMS = [
  { to: "/orders", icon: "receipt_long", label: "Order history", desc: "Track your purchases" },
  { to: "/favorites", icon: "favorite", label: "Favourites", desc: "Your saved drinks" },
  { to: "/loyalty", icon: "stars", label: "Loyalty & rewards", desc: "Ritual points & redemptions" },
  { to: "/subscriptions", icon: "autorenew", label: "Subscriptions", desc: "Recurring deliveries" },
  { to: "/notifications", icon: "notifications", label: "Notifications", desc: "Order updates & news" },
];

export default function ProfileWeb() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-5xl text-primary mb-12">Account</h1>

          {/* Profile card */}
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-8 mb-12">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif text-4xl">
                {(user?.full_name || "A").trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-serif text-3xl text-primary">{user?.full_name || "Anonymous"}</h2>
                <p className="text-on-surface-variant">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Stat label="Tier" value={user?.tier || "—"} />
              <Stat label="Points" value={user?.points ?? 0} />
              <Stat label="Status" value={user?.is_verified ? "Verified" : "Unverified"} />
            </div>
          </div>

          {/* Account sections */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            {ITEMS.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-6 hover:border-primary hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">{it.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-primary">{it.label}</h3>
                    <p className="text-on-surface-variant text-sm mt-1">{it.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="px-8 h-12 rounded-full border border-outline-variant text-primary font-medium hover:bg-surface-container-low transition inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">logout</span>
              Sign out
            </button>
            <Link
              to="/settings"
              className="px-8 h-12 rounded-full border border-outline-variant text-on-surface font-medium hover:bg-surface-container-low transition inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">settings</span>
              Settings
            </Link>
          </div>
        </div>
      </section>
    </WebShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white border border-outline-variant p-4 text-center">
      <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="font-serif text-2xl text-primary mt-2">{value}</p>
    </div>
  );
}
