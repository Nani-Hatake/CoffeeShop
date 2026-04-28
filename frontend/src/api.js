const TOKEN_KEY = "artisan_brew_token";
const BASE_URL = import.meta.env.VITE_API_URL || "";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `${res.status} ${res.statusText}`;

    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  verify: (payload) => request("/auth/verify", { method: "POST", body: payload }),
  resendCode: (email) => request("/auth/resend-code", { method: "POST", body: { email } }),
  me: () => request("/auth/me", { auth: true }),

  listCategories: () => request("/categories"),
  listProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (slug) => request(`/products/${encodeURIComponent(slug)}`),

  getCart: () => request("/cart", { auth: true }),
  addToCart: (payload) => request("/cart/items", { method: "POST", body: payload, auth: true }),
  updateCartItem: (id, patch) =>
    request(`/cart/items/${id}`, { method: "PATCH", body: patch, auth: true }),
  removeCartItem: (id) => request(`/cart/items/${id}`, { method: "DELETE", auth: true }),
  clearCart: () => request("/cart", { method: "DELETE", auth: true }),

  listOrders: () => request("/orders", { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),
  checkout: (payload) => request("/orders/checkout", { method: "POST", body: payload || {}, auth: true }),

  listFavorites: () => request("/favorites", { auth: true }),
  addFavorite: (productId) => request(`/favorites/${productId}`, { method: "POST", auth: true }),
  removeFavorite: (productId) => request(`/favorites/${productId}`, { method: "DELETE", auth: true }),

  listRewards: () => request("/rewards"),
  listRedemptions: () => request("/rewards/me/redemptions", { auth: true }),
  redeem: (id) => request(`/rewards/${id}/redeem`, { method: "POST", auth: true }),

  listNotifications: () => request("/notifications", { auth: true }),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "POST", auth: true }),
  markAllRead: () => request("/notifications/read-all", { method: "POST", auth: true }),

  listStores: () => request("/stores"),

  listSubscriptions: () => request("/subscriptions", { auth: true }),
  createSubscription: (payload) =>
    request("/subscriptions", { method: "POST", body: payload, auth: true }),
  cancelSubscription: (id) =>
    request(`/subscriptions/${id}`, { method: "DELETE", auth: true }),

  listJournal: () => request("/journal"),
  getJournalEntry: (slug) => request(`/journal/${slug}`),
};

export const adminApi = {
  dashboard: () => request("/admin/analytics/dashboard", { auth: true }),
  sales: (period = "week") =>
    request(`/admin/analytics/sales?period=${period}`, { auth: true }),
  inventoryStats: () => request("/admin/analytics/inventory", { auth: true }),
  loyaltyStats: () => request("/admin/analytics/loyalty", { auth: true }),

  listProducts: () => request("/admin/catalog/products", { auth: true }),
  createProduct: (payload) =>
    request("/admin/catalog/products", { method: "POST", body: payload, auth: true }),
  updateProduct: (id, patch) =>
    request(`/admin/catalog/products/${id}`, { method: "PATCH", body: patch, auth: true }),
  deleteProduct: (id) =>
    request(`/admin/catalog/products/${id}`, { method: "DELETE", auth: true }),
  toggleAvailability: (id) =>
    request(`/admin/catalog/products/${id}/availability`, { method: "POST", auth: true }),

  listBatches: (productId) =>
    request(`/admin/catalog/products/${productId}/batches`, { auth: true }),
  createBatch: (payload) =>
    request("/admin/catalog/batches", { method: "POST", body: payload, auth: true }),
  deleteBatch: (id) =>
    request(`/admin/catalog/batches/${id}`, { method: "DELETE", auth: true }),

  listStock: () => request("/admin/inventory/stock", { auth: true }),
  updateStock: (productId, patch) =>
    request(`/admin/inventory/stock/${productId}`, { method: "PATCH", body: patch, auth: true }),

  listSuppliers: () => request("/admin/inventory/suppliers", { auth: true }),
  createSupplier: (payload) =>
    request("/admin/inventory/suppliers", { method: "POST", body: payload, auth: true }),
  updateSupplier: (id, payload) =>
    request(`/admin/inventory/suppliers/${id}`, { method: "PATCH", body: payload, auth: true }),
  deleteSupplier: (id) =>
    request(`/admin/inventory/suppliers/${id}`, { method: "DELETE", auth: true }),

  listGreenBeans: () => request("/admin/inventory/green-beans", { auth: true }),
  addGreenBeans: (payload) =>
    request("/admin/inventory/green-beans", { method: "POST", body: payload, auth: true }),

  listWaste: () => request("/admin/inventory/waste", { auth: true }),
  logWaste: (payload) =>
    request("/admin/inventory/waste", { method: "POST", body: payload, auth: true }),

  listOrders: (status) =>
    request(`/admin/orders${status ? `?status=${status}` : ""}`, { auth: true }),
  liveOrders: () => request("/admin/orders/live", { auth: true }),
  getOrder: (id) => request(`/admin/orders/${id}`, { auth: true }),
  updateOrderStatus: (id, payload) =>
    request(`/admin/orders/${id}/status`, { method: "PATCH", body: payload, auth: true }),

  listCustomers: () => request("/admin/customers", { auth: true }),
  customerDetail: (id) => request(`/admin/customers/${id}`, { auth: true }),

  listJournal: () => request("/admin/content/journal", { auth: true }),
  createJournal: (payload) =>
    request("/admin/content/journal", { method: "POST", body: payload, auth: true }),
  updateJournal: (id, payload) =>
    request(`/admin/content/journal/${id}`, { method: "PATCH", body: payload, auth: true }),
  deleteJournal: (id) =>
    request(`/admin/content/journal/${id}`, { method: "DELETE", auth: true }),

  listPromotions: () => request("/admin/marketing/promotions", { auth: true }),
  createPromotion: (payload) =>
    request("/admin/marketing/promotions", { method: "POST", body: payload, auth: true }),
  updatePromotion: (id, payload) =>
    request(`/admin/marketing/promotions/${id}`, { method: "PATCH", body: payload, auth: true }),
  deletePromotion: (id) =>
    request(`/admin/marketing/promotions/${id}`, { method: "DELETE", auth: true }),

  getLoyaltyRules: () => request("/admin/marketing/loyalty-rules", { auth: true }),
  updateLoyaltyRules: (patch) =>
    request("/admin/marketing/loyalty-rules", { method: "PATCH", body: patch, auth: true }),

  listCategories: () => request("/categories"),
};

export const ownerApi = {
  listStaff: () => request("/owner/workforce/staff", { auth: true }),
  staffDetail: (id) => request(`/owner/workforce/staff/${id}`, { auth: true }),
  enrollStaff: (payload) =>
    request("/owner/workforce/staff", { method: "POST", body: payload, auth: true }),
  updateStaff: (id, payload) =>
    request(`/owner/workforce/staff/${id}`, { method: "PATCH", body: payload, auth: true }),
  offboardStaff: (id) =>
    request(`/owner/workforce/staff/${id}`, { method: "DELETE", auth: true }),

  addReview: (payload) =>
    request("/owner/workforce/reviews", { method: "POST", body: payload, auth: true }),

  listShifts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return request(`/owner/workforce/shifts${qs ? `?${qs}` : ""}`, { auth: true });
  },

  scheduleShift: (payload) =>
    request("/owner/workforce/shifts", { method: "POST", body: payload, auth: true }),
  removeShift: (id) =>
    request(`/owner/workforce/shifts/${id}`, { method: "DELETE", auth: true }),

  payroll: (days = 14) => request(`/owner/workforce/payroll?days=${days}`, { auth: true }),

  pnl: (days = 30) => request(`/owner/finance/pnl?days=${days}`, { auth: true }),
  listExpenses: () => request("/owner/finance/expenses", { auth: true }),
  addExpense: (payload) =>
    request("/owner/finance/expenses", { method: "POST", body: payload, auth: true }),
  deleteExpense: (id) =>
    request(`/owner/finance/expenses/${id}`, { method: "DELETE", auth: true }),

  getTax: () => request("/owner/finance/tax", { auth: true }),
  updateTax: (patch) =>
    request("/owner/finance/tax", { method: "PATCH", body: patch, auth: true }),

  listSandbox: () => request("/owner/lab/products", { auth: true }),
  createSandbox: (payload) =>
    request("/owner/lab/products", { method: "POST", body: payload, auth: true }),
  updateSandbox: (id, patch) =>
    request(`/owner/lab/products/${id}`, { method: "PATCH", body: patch, auth: true }),
  publishSandbox: (id, payload) =>
    request(`/owner/lab/products/${id}/publish`, { method: "POST", body: payload, auth: true }),
  deleteSandbox: (id) =>
    request(`/owner/lab/products/${id}`, { method: "DELETE", auth: true }),

  listMargins: () => request("/owner/lab/margins", { auth: true }),
  upsertMargin: (payload) =>
    request("/owner/lab/margins", { method: "PUT", body: payload, auth: true }),

  pricingSuggestions: () => request("/owner/lab/pricing-suggestions", { auth: true }),

  compareLocations: (days = 30) =>
    request(`/owner/locations/compare?days=${days}`, { auth: true }),

  investor: (days = 90) =>
    request(`/owner/reports/investor?days=${days}`, { auth: true }),

  auditLogs: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return request(`/owner/reports/audit-logs${qs ? `?${qs}` : ""}`, { auth: true });
  },

  listStores: () => request("/stores"),
  listCategories: () => request("/categories"),
};
