import { NavLink } from "react-router-dom";

const items = [
  { to: "/home",          label: "Home",     icon: "home" },
  { to: "/search",        label: "Menu",     icon: "coffee" },
  { to: "/orders",        label: "Orders",   icon: "receipt_long" },
  { to: "/profile",       label: "Profile",  icon: "person" },
];

export default function BottomNav() {
  return (
    <nav className="mt-auto sticky bottom-0 left-0 w-full z-40 flex flex-shrink-0 justify-around items-center h-20 px-4 bg-[#FAF9F6] border-t border-stone-200 shadow-[0_-2px_10px_rgba(62,39,35,0.05)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            "flex flex-col items-center justify-center transition-colors " +
            (isActive
              ? "text-primary scale-110 font-bold"
              : "text-stone-400 hover:text-primary")
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-serif text-[10px] uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
