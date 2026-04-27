import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function CartWeb() {
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

  return (
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-5xl text-primary mb-2">Your Bag</h1>
          <p className="text-on-surface-variant text-lg mb-8">Review your order before confirming.</p>

          {cart.items.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[72px] text-outline inline-block">shopping_bag</span>
              <h2 className="font-serif text-4xl text-primary mt-6">Your bag is empty</h2>
              <p className="text-on-surface-variant mt-4 text-lg max-w-md mx-auto">
                Pick up where the ritual begins — a single-origin pour or a signature latte.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-8 h-12 rounded-full bg-primary text-on-primary font-medium mt-8 hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined">coffee</span>
                Browse the menu
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Items */}
              <div className="lg:col-span-2">
                <ul className="space-y-4">
                  {cart.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-6 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant"
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-serif text-2xl text-primary">{item.product.name}</h3>
                            <p className="text-on-surface-variant mt-1">
                              {item.size} · {item.milk}
                            </p>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            className="text-on-surface-variant hover:text-error transition"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="inline-flex items-center bg-surface-container-low rounded-lg border border-outline-variant">
                            <button
                              onClick={() => changeQty(item, -1)}
                              className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition"
                            >
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => changeQty(item, 1)}
                              className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition"
                            >
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>
                          <span className="font-serif text-xl text-primary">${item.line_total.toFixed(2)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-6 sticky top-24">
                  <h3 className="font-serif text-2xl text-primary mb-6">Order summary</h3>

                  <div className="space-y-3 mb-6">
                    <Row label="Subtotal" value={`$${cart.subtotal.toFixed(2)}`} />
                    <Row label="Tax" value={`$${cart.tax.toFixed(2)}`} />
                    <div className="border-t border-outline-variant" />
                    <Row
                      label={<span className="font-serif text-lg">Total</span>}
                      value={<span className="font-serif text-lg text-primary">${cart.total.toFixed(2)}</span>}
                    />
                  </div>

                  <button
                    onClick={onCheckout}
                    disabled={checkingOut}
                    className="w-full h-12 rounded-full bg-primary text-on-primary font-medium tracking-wide hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    {checkingOut ? "Confirming…" : "Confirm order"}
                  </button>

                  <Link
                    to="/search"
                    className="block text-center text-primary text-sm mt-4 underline underline-offset-4 hover:opacity-80 transition"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </WebShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-on-surface">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
