import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

const NAV = [
  // Operations (admin + owner)
  { section: "Operations" },
  { to: "/admin",             label: "Dashboard",     icon: "dashboard",      role: "admin" },
  { to: "/admin/orders",      label: "Orders",        icon: "receipt_long",   role: "admin" },
  { to: "/admin/products",    label: "Catalog",       icon: "coffee",         role: "admin" },
  { to: "/admin/inventory",   label: "Inventory",     icon: "inventory",      role: "admin" },
  { to: "/admin/suppliers",   label: "Suppliers",     icon: "local_shipping", role: "admin" },
  { to: "/admin/customers",   label: "Customers",     icon: "groups",         role: "admin" },
  { to: "/admin/journal",     label: "Journal",       icon: "edit_note",      role: "admin" },
  { to: "/admin/promotions",  label: "Promotions",    icon: "redeem",         role: "admin" },

  // Strategy (owner only)
  { section: "Strategy", role: "owner" },
  { to: "/admin/finance",     label: "Finance & P&L", icon: "account_balance", role: "owner" },
  { to: "/admin/workforce",   label: "Workforce",     icon: "badge",          role: "owner" },
  { to: "/admin/lab",         label: "Product lab",   icon: "science",        role: "owner" },
  { to: "/admin/locations",   label: "Atelier compare", icon: "compare_arrows", role: "owner" },
  { to: "/admin/loyalty",     label: "Loyalty rules", icon: "stars",          role: "owner" },
  { to: "/admin/investor",    label: "Investor report", icon: "trending_up",  role: "owner" },
  { to: "/admin/audit",       label: "Audit log",     icon: "history",        role: "owner" },
];

export default function AdminShell({ children, title, subtitle, actions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOwner = user?.role === "owner";

  // Filter to items the user can see, plus their section headers.
  const visible = NAV.filter((item) =>
    item.section
      ? !item.role || isOwner
      : item.role === "admin" || isOwner
  );

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 w-64 bg-primary text-on-primary z-40 transform transition-transform " +
          "lg:translate-x-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="px-6 py-6 border-b border-on-primary/10">
          <Link to="/admin" className="block">
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Artisan Brew</p>
            <p className="font-serif italic text-2xl">Atelier OS</p>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-180px)]">
          {visible.map((item, i) => {
            if (item.section) {
              return (
                <p
                  key={`sec-${i}`}
                  className="text-[10px] uppercase tracking-[0.25em] text-on-primary/50 font-semibold px-4 mt-4 mb-1"
                >
                  {item.section}
                  {item.role === "owner" && (
                    <span className="ml-2 text-[9px] tracking-widest bg-on-primary/15 px-1.5 py-0.5 rounded-full">
                      Owner
                    </span>
                  )}
                </p>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-4 h-10 rounded-lg text-sm transition " +
                  (isActive
                    ? "bg-on-primary/15 text-on-primary font-medium"
                    : "text-on-primary/70 hover:bg-on-primary/10 hover:text-on-primary")
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-on-primary/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-on-primary/15 flex items-center justify-center font-serif">
              {(user?.full_name || "?").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user?.full_name}</p>
              <p className="text-[10px] uppercase tracking-widest opacity-70">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/sign-in"); }}
            className="w-full text-sm text-on-primary/70 hover:text-on-primary transition flex items-center gap-2 px-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-outline-variant">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-primary"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="min-w-0">
                {subtitle && (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                    {subtitle}
                  </p>
                )}
                <h1 className="font-serif text-2xl text-primary truncate">
                  {title || "Admin"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Link
                to="/home"
                className="hidden sm:inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Storefront
              </Link>
            </div>
          </div>
        </header>

        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}


export function StatCard({ icon, label, value, delta, accent = "primary" }) {
  const accentClass =
    accent === "tertiary"
      ? "bg-tertiary-container text-on-tertiary"
      : accent === "warning"
      ? "bg-error-container text-on-error-container"
      : "bg-primary-container text-on-primary";

  return (
    <div className="rounded-2xl bg-white border border-outline-variant p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentClass}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">{label}</p>
      </div>
      <p className="font-serif text-3xl text-primary leading-none">{value}</p>
      {delta && (
        <p className="text-xs text-on-surface-variant mt-2">{delta}</p>
      )}
    </div>
  );
}


export function Section({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white border border-outline-variant ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <h2 className="font-serif text-lg text-primary">{title}</h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
