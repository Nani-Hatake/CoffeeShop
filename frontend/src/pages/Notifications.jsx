import { useEffect, useState } from "react";

import AppShell from "../components/AppShell.jsx";
import { api } from "../api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    api.listNotifications().then(setItems).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const markRead = async (n) => {
    if (n.is_read) return;
    await api.markRead(n.id);
    setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
  };

  const allRead = async () => {
    await api.markAllRead();
    setItems((arr) => arr.map((x) => ({ ...x, is_read: true })));
  };

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <AppShell
      title="Notifications"
      showBack
      action={
        unread > 0 ? (
          <button onClick={allRead} className="text-[12px] text-primary underline underline-offset-4">
            Mark all read
          </button>
        ) : null
      }
    >
      <section className="py-lg">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Activity</p>
        <h1 className="font-serif text-[28px] text-primary mt-1">
          {unread > 0 ? `${unread} new` : "All caught up."}
        </h1>
      </section>

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-on-surface-variant text-center py-12">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 pb-6">
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => markRead(n)}
              className={
                "flex gap-3 p-4 rounded-2xl border transition cursor-pointer " +
                (n.is_read
                  ? "bg-surface-container-lowest border-outline-variant"
                  : "bg-surface-container border-primary-fixed-dim")
              }
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined">{n.icon || "notifications"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-[16px] leading-tight text-primary">{n.title}</h3>
                {n.body && <p className="text-sm text-on-surface-variant mt-1">{n.body}</p>}
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2" />}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
