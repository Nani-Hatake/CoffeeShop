import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);
const EMPTY = { items: [], subtotal: 0, tax: 0, total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      return EMPTY;
    }
    setLoading(true);
    try {
      const data = await api.getCart();
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (productId, opts = {}) => {
    const data = await api.addToCart({ product_id: productId, ...opts });
    setCart(data);
    return data;
  };

  const update = async (itemId, patch) => {
    const data = await api.updateCartItem(itemId, patch);
    setCart(data);
    return data;
  };

  const remove = async (itemId) => {
    const data = await api.removeCartItem(itemId);
    setCart(data);
    return data;
  };

  const clear = async () => {
    const data = await api.clearCart();
    setCart(data);
    return data;
  };

  const itemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, itemCount, loading, refresh, add, update, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
