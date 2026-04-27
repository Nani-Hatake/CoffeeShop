import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";

export default function TopBar({ title = "Artisan Brew", showBack = false, action = null }) {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  return (
    <header className="bg-[#FAF9F6] flex justify-between items-center px-5 h-16 w-full sticky top-0 z-40 border-b border-stone-200 shadow-sm">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:opacity-80 transition active:scale-95"
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <Link to="/profile" className="text-primary" aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </Link>
        )}
        <span className="font-serif italic text-2xl text-primary">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <Link to="/cart" className="relative text-primary" aria-label="Cart">
          <span className="material-symbols-outlined">shopping_bag</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
