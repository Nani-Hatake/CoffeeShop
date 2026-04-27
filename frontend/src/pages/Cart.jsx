import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Cart() {
  const { cart, update, remove, refresh } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [checkingOut, setCheckingOut] = useState(false);

  const changeQty = async (item, delta) => {
    const next = item.quantity + delta;
    if (next <= 0) {
      await remove(item.id);
      return;
    }
    await update(item.id, { quantity: next });
  };

  const onCheckout = async () => {
    setCheckingOut(true);
    try {
      const order = await api.checkout({});
      await refresh();
      toast.push("Order confirmed.", { tone: "success" });
      navigate(`/order/${order.id}/success`, { replace: true, state: { order } });
    } catch (err) {
      toast.push(err.message || "Checkout failed", { tone: "error" });
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <AppShell title="Your bag" showBack>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <span className="material-symbols-outlined text-[56px] text-outline">shopping_bag</span>
          <h2 className="font-serif text-[28px] text-primary mt-4">Your bag is empty</h2>
          <p className="text-on-surface-variant mt-2 max-w-[280px]">
            Pick up where the ritual begins &mdash; a single-origin pour or a signature latte.
          </p>
          <Link to="/home" className="mt-8 px-8 h-12 rounded-full bg-primary text-on-primary font-medium inline-flex items-center justify-center">
            Browse the menu
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Your bag" showBack hideBottomNav>
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">{cart.items.length} item{cart.items.length === 1 ? "" : "s"}</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">Review &amp; brew.</h1>
      </section>

      <ul className="flex flex-col gap-3 pb-6">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
              {item.product.image_url && (
                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-serif text-[18px] leading-tight text-primary">{item.product.name}</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">
                    {item.size} · {item.milk}
                  </p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="text-on-surface-variant hover:text-error"
                  aria-label="Remove"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="inline-flex items-center bg-surface-container-low rounded-full border border-outline-variant">
                  <button onClick={() => changeQty(item, -1)} className="w-8 h-8 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => changeQty(item, 1)} className="w-8 h-8 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
                <span className="font-medium text-primary">${item.line_total.toFixed(2)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-4 mt-2">
        <Row label="Subtotal" value={`$${cart.subtotal.toFixed(2)}`} />
        <Row label="Tax" value={`$${cart.tax.toFixed(2)}`} />
        <div className="border-t border-outline-variant my-2" />
        <Row label={<span className="font-serif text-lg text-primary">Total</span>} value={<span className="font-serif text-lg text-primary">${cart.total.toFixed(2)}</span>} />
      </div>

      <button
        onClick={onCheckout}
        disabled={checkingOut}
        className="mt-6 w-full h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide active:scale-[.99] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">check_circle</span>
        {checkingOut ? "Confirming…" : "Confirm order"}
      </button>
    </AppShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-on-surface">
      <span className="text-on-surface-variant">{label}</span>
      <span>{value}</span>
    </div>
  );
}
