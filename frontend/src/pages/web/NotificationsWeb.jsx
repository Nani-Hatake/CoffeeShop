import { useEffect, useState } from "react";

import WebShell from "../../components/WebShell.jsx";
import { api } from "../../api";

export default function NotificationsWeb() {
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
    <WebShell>
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Activity</p>
              <h1 className="font-serif text-5xl text-primary mt-2">
                {unread > 0 ? `${unread} new` : "All caught up."}
              </h1>
            </div>
            {unread > 0 && (
              <button
                onClick={allRead}
                className="text-primary underline underline-offset-4 hover:opacity-80 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[72px] text-outline">notifications_off</span>
              <p className="text-on-surface-variant mt-4">Nothing here yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={
                    "flex gap-4 p-6 rounded-2xl border transition cursor-pointer " +
                    (n.is_read
                      ? "bg-surface-container-lowest border-outline-variant"
                      : "bg-surface-container border-primary-fixed-dim hover:border-primary")
                  }
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">{n.icon || "notifications"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl text-primary leading-tight">{n.title}</h3>
                    {n.body && <p className="text-on-surface-variant mt-2">{n.body}</p>}
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-3">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-3 h-3 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </WebShell>
  );
}
