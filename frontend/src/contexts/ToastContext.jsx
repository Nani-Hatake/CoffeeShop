import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const toast = {
      id,
      message,
      tone: opts.tone || "default",
      duration: opts.duration || 2600,
    };
    setToasts((t) => [...t, toast]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto px-5 py-3 rounded-full shadow-lg text-sm font-medium animate-fade-in " +
              (t.tone === "error"
                ? "bg-error text-on-error"
                : t.tone === "success"
                ? "bg-tertiary-container text-on-tertiary"
                : "bg-primary text-on-primary")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
