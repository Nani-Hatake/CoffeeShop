import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "./components/RequireAuth.jsx";
import { useIsMobile } from "./hooks/useIsMobile.js";
import StaticScreen from "./components/StaticScreen.jsx";

import Welcome from "./pages/Welcome.jsx";
import SignIn from "./pages/SignIn.jsx";
import Join from "./pages/Join.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";

import Profile from "./pages/Profile.jsx";
import Favorites from "./pages/Favorites.jsx";
import Notifications from "./pages/Notifications.jsx";
import Loyalty from "./pages/Loyalty.jsx";
import StoreLocator from "./pages/StoreLocator.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Settings from "./pages/Settings.jsx";

// Admin
import AdminGuard from "./components/admin/AdminGuard.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";
import AdminProducts from "./pages/admin/Products.jsx";
import AdminInventory from "./pages/admin/Inventory.jsx";
import AdminSuppliers from "./pages/admin/Suppliers.jsx";
import AdminCustomers from "./pages/admin/Customers.jsx";
import AdminJournal from "./pages/admin/Journal.jsx";
import AdminPromotions from "./pages/admin/Promotions.jsx";
import AdminLoyaltyRules from "./pages/admin/LoyaltyRules.jsx";

// Owner
import OwnerWorkforce from "./pages/admin/owner/Workforce.jsx";
import OwnerFinance from "./pages/admin/owner/Finance.jsx";
import OwnerProductLab from "./pages/admin/owner/ProductLab.jsx";
import OwnerLocations from "./pages/admin/owner/Locations.jsx";
import OwnerInvestorReport from "./pages/admin/owner/InvestorReport.jsx";
import OwnerAuditLog from "./pages/admin/owner/AuditLog.jsx";

// Web versions
import HomeWeb from "./pages/web/HomeWeb.jsx";
import SearchWeb from "./pages/web/SearchWeb.jsx";
import CartWeb from "./pages/web/CartWeb.jsx";
import ProfileWeb from "./pages/web/ProfileWeb.jsx";
import OrdersWeb from "./pages/web/OrdersWeb.jsx";
import OrderSuccessWeb from "./pages/web/OrderSuccessWeb.jsx";
import FavoritesWeb from "./pages/web/FavoritesWeb.jsx";
import NotificationsWeb from "./pages/web/NotificationsWeb.jsx";
import LoyaltyWeb from "./pages/web/LoyaltyWeb.jsx";
import StoreLocatorWeb from "./pages/web/StoreLocatorWeb.jsx";
import SubscriptionsWeb from "./pages/web/SubscriptionsWeb.jsx";

export default function App() {
  const isMobile = useIsMobile();

  // Mobile routes
  const MobileRoutes = (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />

      {/* Auth & onboarding */}
      <Route path="/welcome"           element={<Welcome />} />
      <Route path="/sign-in"           element={<SignIn />} />
      <Route path="/join"              element={<Join />} />
      <Route path="/verify-email"      element={<VerifyEmail />} />

      {/* Core app */}
      <Route path="/home"              element={<Home />} />
      <Route path="/search"            element={<Search />} />
      <Route path="/product/:slug"     element={<ProductDetail />} />

      <Route path="/cart"              element={<RequireAuth><Cart /></RequireAuth>} />
      <Route path="/orders"            element={<RequireAuth><Orders /></RequireAuth>} />
      <Route path="/order/:id/success" element={<RequireAuth><OrderSuccess /></RequireAuth>} />

      <Route path="/profile"           element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/favorites"         element={<RequireAuth><Favorites /></RequireAuth>} />
      <Route path="/notifications"     element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/loyalty"           element={<RequireAuth><Loyalty /></RequireAuth>} />
      <Route path="/stores"            element={<StoreLocator />} />
      <Route path="/subscriptions"     element={<RequireAuth><Subscriptions /></RequireAuth>} />

      {/* Settings — proper responsive React page */}
      <Route path="/settings"              element={<RequireAuth><Settings /></RequireAuth>} />

      {/* Static screens (visual-only design fidelity) */}
      <Route path="/help"                  element={<StaticScreen slug="help_support"            title="Help & Support" />} />
      <Route path="/brew-journal"          element={<StaticScreen slug="brew_journal"            title="Brew Journal" />} />
      <Route path="/master-class"          element={<StaticScreen slug="roast_master_class"      title="Roast Master Class" />} />
      <Route path="/master-class/v60"      element={<StaticScreen slug="roast_master_class_v60"  title="V60 Master Class" />} />
      <Route path="/master-class/v60/bloom" element={<StaticScreen slug="v60_the_bloom"          title="V60 — The Bloom" />} />
      <Route path="/gifts"                 element={<StaticScreen slug="gift_a_ritual_1"         title="Gift a Ritual" />} />
      <Route path="/gifts/step-2"          element={<StaticScreen slug="gift_a_ritual_2"         title="Gift a Ritual" />} />
      <Route path="/gifts/personalize"     element={<StaticScreen slug="personalize_your_gift"   title="Personalize Gift" />} />
      <Route path="/referrals"             element={<StaticScreen slug="referral_program"        title="Refer a Friend" />} />
      <Route path="/rewards/redeem/:id"    element={<StaticScreen slug="confirm_redemption"      title="Confirm Redemption" />} />
      <Route path="/rewards/ready/:id"     element={<StaticScreen slug="reward_ready"            title="Reward Ready" />} />
      <Route path="/order/updated/:id"     element={<StaticScreen slug="order_confirmed_updated" title="Order Confirmed" />} />
      <Route path="/cart/updated"          element={<StaticScreen slug="your_basket_updated"     title="Basket Updated" />} />
      <Route path="/screens/origin/yirgacheffe" element={<StaticScreen slug="ethiopian_yirgacheffe_detail" title="Ethiopian Yirgacheffe" />} />
      <Route path="/screens/flat-white-v2" element={<StaticScreen slug="product_details_flat_white_v2" title="Flat White" />} />

      {/* Admin (always rendered with desktop-first AdminShell) */}
      <Route path="/admin"            element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/orders"     element={<AdminGuard><AdminOrders /></AdminGuard>} />
      <Route path="/admin/products"   element={<AdminGuard><AdminProducts /></AdminGuard>} />
      <Route path="/admin/inventory"  element={<AdminGuard><AdminInventory /></AdminGuard>} />
      <Route path="/admin/suppliers"  element={<AdminGuard><AdminSuppliers /></AdminGuard>} />
      <Route path="/admin/customers"  element={<AdminGuard><AdminCustomers /></AdminGuard>} />
      <Route path="/admin/journal"    element={<AdminGuard><AdminJournal /></AdminGuard>} />
      <Route path="/admin/promotions" element={<AdminGuard><AdminPromotions /></AdminGuard>} />
      <Route path="/admin/loyalty"    element={<AdminGuard><AdminLoyaltyRules /></AdminGuard>} />

      {/* Owner-only */}
      <Route path="/admin/finance"    element={<AdminGuard ownerOnly><OwnerFinance /></AdminGuard>} />
      <Route path="/admin/workforce"  element={<AdminGuard ownerOnly><OwnerWorkforce /></AdminGuard>} />
      <Route path="/admin/lab"        element={<AdminGuard ownerOnly><OwnerProductLab /></AdminGuard>} />
      <Route path="/admin/locations"  element={<AdminGuard ownerOnly><OwnerLocations /></AdminGuard>} />
      <Route path="/admin/investor"   element={<AdminGuard ownerOnly><OwnerInvestorReport /></AdminGuard>} />
      <Route path="/admin/audit"      element={<AdminGuard ownerOnly><OwnerAuditLog /></AdminGuard>} />

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );

  // Web routes
  const WebRoutes = (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/join" element={<Join />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/home" element={<HomeWeb />} />
      <Route path="/search" element={<SearchWeb />} />
      <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/cart" element={<RequireAuth><CartWeb /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><OrdersWeb /></RequireAuth>} />
      <Route path="/order/:id/success" element={<RequireAuth><OrderSuccessWeb /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfileWeb /></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><FavoritesWeb /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><NotificationsWeb /></RequireAuth>} />
      <Route path="/loyalty" element={<RequireAuth><LoyaltyWeb /></RequireAuth>} />
      <Route path="/stores" element={<StoreLocatorWeb />} />
      <Route path="/subscriptions" element={<RequireAuth><SubscriptionsWeb /></RequireAuth>} />
      <Route path="/help" element={<StaticScreen slug="help_support" title="Help & Support" hideBottomNav />} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/brew-journal" element={<StaticScreen slug="brew_journal" title="Brew Journal" hideBottomNav />} />
      <Route path="/master-class" element={<StaticScreen slug="roast_master_class" title="Roast Master Class" hideBottomNav />} />
      <Route path="/gifts" element={<StaticScreen slug="gift_a_ritual_1" title="Gift a Ritual" hideBottomNav />} />

      {/* Admin */}
      <Route path="/admin"            element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/orders"     element={<AdminGuard><AdminOrders /></AdminGuard>} />
      <Route path="/admin/products"   element={<AdminGuard><AdminProducts /></AdminGuard>} />
      <Route path="/admin/inventory"  element={<AdminGuard><AdminInventory /></AdminGuard>} />
      <Route path="/admin/suppliers"  element={<AdminGuard><AdminSuppliers /></AdminGuard>} />
      <Route path="/admin/customers"  element={<AdminGuard><AdminCustomers /></AdminGuard>} />
      <Route path="/admin/journal"    element={<AdminGuard><AdminJournal /></AdminGuard>} />
      <Route path="/admin/promotions" element={<AdminGuard><AdminPromotions /></AdminGuard>} />
      <Route path="/admin/loyalty"    element={<AdminGuard><AdminLoyaltyRules /></AdminGuard>} />

      {/* Owner-only */}
      <Route path="/admin/finance"    element={<AdminGuard ownerOnly><OwnerFinance /></AdminGuard>} />
      <Route path="/admin/workforce"  element={<AdminGuard ownerOnly><OwnerWorkforce /></AdminGuard>} />
      <Route path="/admin/lab"        element={<AdminGuard ownerOnly><OwnerProductLab /></AdminGuard>} />
      <Route path="/admin/locations"  element={<AdminGuard ownerOnly><OwnerLocations /></AdminGuard>} />
      <Route path="/admin/investor"   element={<AdminGuard ownerOnly><OwnerInvestorReport /></AdminGuard>} />
      <Route path="/admin/audit"      element={<AdminGuard ownerOnly><OwnerAuditLog /></AdminGuard>} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );

  return isMobile ? MobileRoutes : WebRoutes;
}
