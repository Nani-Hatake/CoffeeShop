from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class SignupIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VerifyIn(BaseModel):
    email: EmailStr
    code: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_verified: bool
    points: int
    tier: str
    role: str = "customer"

    class Config:
        from_attributes = True


# ---------- Categories / Products ----------
class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    slug: str
    name: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    rating: float
    review_count: int
    origin: Optional[str] = None
    roast: Optional[str] = None
    process: Optional[str] = None
    altitude: Optional[str] = None
    tasting_notes: Optional[str] = None
    is_featured: bool
    is_seasonal: bool = False
    is_limited: bool = False
    is_available: bool = True
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class ProductIn(BaseModel):
    slug: str
    name: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float = Field(gt=0)
    image_url: Optional[str] = None
    origin: Optional[str] = None
    roast: Optional[str] = None
    process: Optional[str] = None
    altitude: Optional[str] = None
    tasting_notes: Optional[str] = None
    is_featured: bool = False
    is_seasonal: bool = False
    is_limited: bool = False
    is_available: bool = True


class ProductPatch(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    origin: Optional[str] = None
    roast: Optional[str] = None
    process: Optional[str] = None
    altitude: Optional[str] = None
    tasting_notes: Optional[str] = None
    is_featured: Optional[bool] = None
    is_seasonal: Optional[bool] = None
    is_limited: Optional[bool] = None
    is_available: Optional[bool] = None


# ---------- Cart ----------
class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=20)
    size: str = "Medium"
    milk: str = "Whole"
    notes: Optional[str] = None


class CartItemPatch(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=1, le=20)
    size: Optional[str] = None
    milk: Optional[str] = None
    notes: Optional[str] = None


class CartItemOut(BaseModel):
    id: int
    product: ProductOut
    quantity: int
    size: str
    milk: str
    notes: Optional[str] = None
    line_total: float

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: float
    tax: float
    total: float


# ---------- Orders ----------
class CheckoutIn(BaseModel):
    pickup_store: Optional[str] = None
    note: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    name: str
    unit_price: float
    quantity: int
    size: Optional[str] = None
    milk: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    code: str
    subtotal: float
    tax: float
    total: float
    status: str
    pickup_store: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    items: list[OrderItemOut]

    class Config:
        from_attributes = True


# ---------- Favorites ----------
class FavoriteOut(BaseModel):
    id: int
    product: ProductOut

    class Config:
        from_attributes = True


# ---------- Rewards ----------
class RewardOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    cost_points: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class RedemptionOut(BaseModel):
    id: int
    code: str
    reward: RewardOut
    redeemed_at: datetime

    class Config:
        from_attributes = True


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    icon: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Stores ----------
class StoreOut(BaseModel):
    id: int
    name: str
    address: str
    distance_km: float
    hours: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Subscriptions ----------
class SubscriptionIn(BaseModel):
    product_id: int
    cadence: str = "weekly"
    quantity: int = Field(default=1, ge=1, le=10)


class SubscriptionOut(BaseModel):
    id: int
    product: ProductOut
    cadence: str
    quantity: int
    active: bool
    next_delivery: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================================
# Admin / Owner schemas
# =====================================================================

class StockOut(BaseModel):
    id: int
    product_id: int
    on_hand: int
    low_threshold: int
    is_low: bool = False
    updated_at: datetime

    class Config:
        from_attributes = True


class StockPatch(BaseModel):
    on_hand: Optional[int] = Field(default=None, ge=0)
    low_threshold: Optional[int] = Field(default=None, ge=0)


class BatchIn(BaseModel):
    product_id: int
    batch_number: str
    roast_date: Optional[datetime] = None
    best_by: Optional[datetime] = None
    qty: int = 0
    notes: Optional[str] = None


class BatchOut(BaseModel):
    id: int
    product_id: int
    batch_number: str
    roast_date: Optional[datetime] = None
    best_by: Optional[datetime] = None
    qty: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierIn(BaseModel):
    name: str
    type: str = "bean"
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None


class SupplierOut(SupplierIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class GreenBeanIn(BaseModel):
    supplier_id: int
    origin: str
    process: Optional[str] = None
    altitude: Optional[str] = None
    qty_kg: float = 0.0
    direct_trade: bool = False
    notes: Optional[str] = None


class GreenBeanOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: Optional[str] = None
    origin: str
    process: Optional[str] = None
    altitude: Optional[str] = None
    qty_kg: float
    direct_trade: bool
    arrived_at: datetime

    class Config:
        from_attributes = True


class WasteIn(BaseModel):
    product_id: int
    qty: int
    reason: Optional[str] = None
    cost: float = 0.0


class WasteOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    qty: int
    reason: Optional[str] = None
    cost: float
    created_at: datetime

    class Config:
        from_attributes = True


class PromotionIn(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percent"  # percent | fixed
    discount_value: float = Field(gt=0)
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None
    active: bool = True


class PromotionOut(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    valid_until: Optional[datetime] = None
    usage_count: int
    usage_limit: Optional[int] = None
    active: bool

    class Config:
        from_attributes = True


class JournalEntryIn(BaseModel):
    slug: str
    title: str
    excerpt: Optional[str] = None
    body: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    published: bool = False


class JournalEntryOut(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: Optional[str] = None
    body: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    published: bool
    published_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LoyaltyRuleOut(BaseModel):
    id: int
    points_per_dollar: float
    redemption_threshold: int
    referral_bonus: int
    welcome_bonus: int
    updated_at: datetime

    class Config:
        from_attributes = True


class LoyaltyRulePatch(BaseModel):
    points_per_dollar: Optional[float] = None
    redemption_threshold: Optional[int] = None
    referral_bonus: Optional[int] = None
    welcome_bonus: Optional[int] = None


class CustomerOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    tier: str
    points: int
    is_verified: bool
    created_at: datetime
    order_count: int = 0
    total_spent: float = 0.0

    class Config:
        from_attributes = True


class OrderStatusPatch(BaseModel):
    status: str  # brewing | ready | collected | cancelled | refunded
    refund_reason: Optional[str] = None


class AdminOrderOut(OrderOut):
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class SalesPoint(BaseModel):
    label: str
    revenue: float
    orders: int


class SalesAnalyticsOut(BaseModel):
    period: str
    total_revenue: float
    total_orders: int
    avg_order_value: float
    series: list[SalesPoint]
    top_products: list[dict]
    peak_hours: list[dict]


class InventoryAnalyticsOut(BaseModel):
    low_stock: list[dict]
    out_of_stock: list[dict]
    turn_rate: list[dict]
    waste_total: float
    waste_count: int


class LoyaltyAnalyticsOut(BaseModel):
    total_points_issued: int
    total_redemptions: int
    redemption_rate: float
    active_members: int


# =====================================================================
# Owner-only schemas
# =====================================================================

class StaffIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str = "Barista"
    employment_type: str = "hourly"
    hourly_rate: float = 0.0
    monthly_salary: float = 0.0
    overtime_multiplier: float = 1.5
    bank_account: Optional[str] = None
    store_id: Optional[int] = None
    certifications: Optional[str] = None
    health_permit_expires: Optional[datetime] = None
    hire_date: Optional[datetime] = None
    active: bool = True
    notes: Optional[str] = None


class StaffOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    employment_type: str
    hourly_rate: float
    monthly_salary: float
    overtime_multiplier: float
    bank_account: Optional[str] = None
    store_id: Optional[int] = None
    store_name: Optional[str] = None
    certifications: Optional[str] = None
    health_permit_expires: Optional[datetime] = None
    hire_date: datetime
    active: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ShiftIn(BaseModel):
    staff_id: int
    store_id: Optional[int] = None
    start: datetime
    end: datetime
    role: Optional[str] = None
    bonus: float = 0.0
    notes: Optional[str] = None


class ShiftOut(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    store_id: Optional[int] = None
    store_name: Optional[str] = None
    start: datetime
    end: datetime
    role: Optional[str] = None
    bonus: float
    hours: float = 0.0

    class Config:
        from_attributes = True


class PerformanceReviewIn(BaseModel):
    staff_id: int
    reviewer: Optional[str] = None
    rating: int = Field(default=3, ge=1, le=5)
    summary: str


class PerformanceReviewOut(BaseModel):
    id: int
    staff_id: int
    reviewer: Optional[str] = None
    rating: int
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollLineOut(BaseModel):
    staff_id: int
    full_name: str
    position: str
    employment_type: str
    hours_regular: float
    hours_overtime: float
    base_pay: float
    overtime_pay: float
    bonus: float
    gross: float
    net: float          # post-tax estimate (gross * (1 - tax_rate/100) — simplified)


class PayrollSummaryOut(BaseModel):
    period_start: datetime
    period_end: datetime
    total_gross: float
    total_net: float
    total_hours: float
    total_overtime: float
    revenue: float
    labor_pct: float
    lines: list[PayrollLineOut]


class ExpenseIn(BaseModel):
    category: str
    description: Optional[str] = None
    vendor: Optional[str] = None
    amount: float = Field(gt=0)
    incurred_at: Optional[datetime] = None


class ExpenseOut(BaseModel):
    id: int
    category: str
    description: Optional[str] = None
    vendor: Optional[str] = None
    amount: float
    incurred_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class TaxSettingPatch(BaseModel):
    jurisdiction: Optional[str] = None
    tax_rate: Optional[float] = None
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    address: Optional[str] = None


class TaxSettingOut(BaseModel):
    id: int
    jurisdiction: str
    tax_rate: float
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    address: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class PnLOut(BaseModel):
    period_start: datetime
    period_end: datetime
    gross_revenue: float
    refunds: float
    net_revenue: float
    cogs: float
    gross_profit: float
    gross_margin_pct: float
    labor: float
    overhead: float
    operating_expenses: float
    net_profit: float
    net_margin_pct: float
    expense_breakdown: list[dict]


class MarginTargetIn(BaseModel):
    category_id: int
    target_pct: float
    notes: Optional[str] = None


class MarginTargetOut(BaseModel):
    id: int
    category_id: int
    category_name: Optional[str] = None
    target_pct: float
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class PriceSuggestionOut(BaseModel):
    product_id: int
    name: str
    current_price: float
    cost_per_unit: float
    current_margin_pct: float
    target_margin_pct: Optional[float] = None
    suggested_price: Optional[float] = None
    suggestion: str   # "raise" | "lower" | "ok"


class SandboxPublishIn(BaseModel):
    is_featured: bool = False


class StoreCompareOut(BaseModel):
    store_id: Optional[int] = None
    store_name: str
    revenue: float
    orders: int
    avg_order_value: float
    waste_cost: float
    labor_cost: float
    labor_pct: float


class InvestorReportOut(BaseModel):
    period_start: datetime
    period_end: datetime
    revenue: float
    net_profit: float
    net_margin_pct: float
    customer_count: int
    new_customers: int
    avg_order_value: float
    cac: float
    ltv: float
    cac_ltv_ratio: float
    top_products: list[dict]
    locations: list[StoreCompareOut]


class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
