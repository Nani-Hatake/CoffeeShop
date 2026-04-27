import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AdminErrorBoundary from "./ErrorBoundary.jsx";

export default function AdminGuard({ children, ownerOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  const isAdmin = user.role === "admin" || user.role === "owner";
  const isOwner = user.role === "owner";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <div className="max-w-md text-center p-8 rounded-2xl bg-white border border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-error">block</span>
          <h2 className="font-serif text-2xl text-primary mt-4">Admin access required</h2>
          <p className="text-on-surface-variant mt-2">
            This area is restricted to staff. Sign in with an admin or owner account.
          </p>
        </div>
      </div>
    );
  }

  if (ownerOnly && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <div className="max-w-md text-center p-8 rounded-2xl bg-white border border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-error">lock</span>
          <h2 className="font-serif text-2xl text-primary mt-4">Owner access required</h2>
          <p className="text-on-surface-variant mt-2">
            Financial settings and loyalty rules are scoped to the Owner role.
          </p>
        </div>
      </div>
    );
  }

  // The `key` ensures a clean unmount/remount when navigating between admin
  // routes — prevents stale state or modals leaking across pages.
  return (
    <AdminErrorBoundary key={location.pathname}>
      {children}
    </AdminErrorBoundary>
  );
}
