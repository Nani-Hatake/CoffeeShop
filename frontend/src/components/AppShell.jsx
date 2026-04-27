import BottomNav from "./BottomNav.jsx";
import MobileFrame from "./MobileFrame.jsx";
import TopBar from "./TopBar.jsx";

export default function AppShell({
  children,
  title,
  showBack = false,
  hideTopBar = false,
  hideBottomNav = false,
  action,
}) {
  return (
    <MobileFrame>
      {!hideTopBar && <TopBar title={title} showBack={showBack} action={action} />}
      {/* `flex-1` lets the main grow to fill the remaining viewport height,
          which pushes BottomNav to the actual bottom even when content is short. */}
      <main className="flex flex-col flex-1 px-margin-mobile pb-6">
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </MobileFrame>
  );
}
