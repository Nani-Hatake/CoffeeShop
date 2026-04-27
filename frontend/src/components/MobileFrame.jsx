export default function MobileFrame({ children }) {
  // Phone-style canvas centred on desktop, full-bleed on mobile.
  // The inner container is a flex column so AppShell can place BottomNav
  // at the true viewport bottom regardless of how short the content is.
  return (
    <div className="min-h-screen bg-surface-container-low">
      <div className="max-w-[440px] mx-auto bg-background min-h-screen relative shadow-[0_30px_80px_-20px_rgba(39,19,16,0.20)] flex flex-col">
        {children}
      </div>
    </div>
  );
}
