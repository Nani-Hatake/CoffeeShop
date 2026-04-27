import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "./AppShell.jsx";

/**
 * Renders a screen whose visual design is preserved verbatim from the original
 * /docs HTML mocks. The body content of the corresponding screen file is fetched
 * from /screens/<slug>.body.html and injected via dangerouslySetInnerHTML.
 *
 * Use for screens whose interactivity isn't required for the end-to-end demo
 * (e.g. master class, store locator, gifts, etc.). Dynamic screens (home, cart,
 * product, checkout, profile) bypass this and render their own JSX.
 */
export default function StaticScreen({ slug, title, showBack = true, hideBottomNav = false }) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/screens/${slug}.body.html`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load screen: ${slug}`);
        return r.text();
      })
      .then((t) => { if (!cancelled) setHtml(t); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <AppShell title={title} showBack={showBack} hideBottomNav={hideBottomNav}>
      {error ? (
        <div className="py-12 text-center">
          <p className="text-on-surface-variant">{error}</p>
          <Link to="/home" className="inline-block mt-4 text-primary underline">
            Back to home
          </Link>
        </div>
      ) : (
        <div
          className="static-screen -mx-margin-mobile"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </AppShell>
  );
}
