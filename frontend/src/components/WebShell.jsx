import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";

export default function WebShell({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-outline-variant shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="font-serif italic text-3xl text-primary">
            Artisan Brew
          </Link>

          <nav className="flex items-center gap-8">
            <Link to="/home" className="text-on-surface hover:text-primary transition font-medium">
              Home
            </Link>
            <Link to="/search" className="text-on-surface hover:text-primary transition font-medium">
              Menu
            </Link>
            <Link to="/loyalty" className="text-on-surface hover:text-primary transition font-medium">
              Loyalty
            </Link>
            <Link to="/stores" className="text-on-surface hover:text-primary transition font-medium">
              Cafés
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <Link to="/notifications" className="relative text-primary hover:opacity-80 transition">
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            <Link to="/cart" className="relative text-primary hover:opacity-80 transition">
              <span className="material-symbols-outlined">shopping_bag</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-error text-on-error text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-outline-variant">
                {(user.role === "admin" || user.role === "owner") && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-primary-container text-on-primary text-xs font-medium tracking-wide hover:opacity-90 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    Atelier OS
                  </Link>
                )}
                <Link to="/profile" className="text-on-surface hover:text-primary transition">
                  <span className="text-sm">{user.full_name?.split(" ")[0] || "Profile"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-on-surface-variant hover:text-error transition text-sm"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition text-sm"
                  title="Customer, admin, or owner"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign in
                </Link>
                <Link
                  to="/join"
                  className="px-4 h-10 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition inline-flex items-center justify-center"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-on-primary mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-12">
            <div>
              <p className="font-serif italic text-2xl mb-2">Artisan Brew</p>
              <p className="text-on-primary/70 text-sm">Curating the morning ritual.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-on-primary/70">
                <li><Link to="/home" className="hover:text-on-primary transition">Home</Link></li>
                <li><Link to="/search" className="hover:text-on-primary transition">Menu</Link></li>
                <li><Link to="/master-class" className="hover:text-on-primary transition">Master Class</Link></li>
                <li><Link to="/gifts" className="hover:text-on-primary transition">Gifts</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Account</h3>
              <ul className="space-y-2 text-sm text-on-primary/70">
                <li><Link to="/orders" className="hover:text-on-primary transition">Orders</Link></li>
                <li><Link to="/favorites" className="hover:text-on-primary transition">Favorites</Link></li>
                <li><Link to="/loyalty" className="hover:text-on-primary transition">Rewards</Link></li>
                <li><Link to="/subscriptions" className="hover:text-on-primary transition">Subscribe</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-on-primary/70">
                <li><Link to="/stores" className="hover:text-on-primary transition">Find café</Link></li>
                <li><Link to="/help" className="hover:text-on-primary transition">Help center</Link></li>
                <li><a href="#" className="hover:text-on-primary transition">Contact us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-on-primary/20 pt-8 text-center text-sm text-on-primary/60">
            <p>&copy; 2026 Artisan Brew. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
