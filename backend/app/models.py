from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(8))
    points = Column(Integer, default=0)
    tier = Column(String(32), default="Apprentice")
    role = Column(String(16), default="customer", nullable=False)  # customer | admin | owner
    created_at = Column(DateTime, default=datetime.utcnow)

    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    redemptions = relationship("Redemption", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False)
    slug = Column(String(64), unique=True, nullable=False)
    sort_order = Column(Integer, default=0)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    name = Column(String(160), nullable=False)
    subtitle = Column(String(255))
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Float, nullable=False)
    image_url = Column(String(512))
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=0)
    # Sensory profile
    origin = Column(String(120))
    roast = Column(String(64))
    process = Column(String(64))           # washed, natural, honey...
    altitude = Column(String(64))           # e.g. "1800-2100 MASL"
    tasting_notes = Column(String(255))
    # Storefront flags
    is_featured = Column(Boolean, default=False)
    is_seasonal = Column(Boolean, default=False)
    is_limited = Column(Boolean, default=False)
    # Availability ("86" toggle) — when False, hidden from storefront
    is_available = Column(Boolean, default=True)
    # Owner Product Lab — sandbox prototypes hidden from storefront
    is_sandbox = Column(Boolean, default=False)
    # Cost of goods sold per unit (Owner-only) — used for P&L and margin targets
    cost_per_unit = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category")
    stock = relationship("Stock", uselist=False, back_populates="product", cascade="all, delete-orphan")
    batches = relationship("BatchLog", back_populates="product", cascade="all, delete-orphan")


class Stock(Base):
    __tablename__ = "stock"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    on_hand = Column(Integer, default=0, nullable=False)
    low_threshold = Column(Integer, default=10, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="stock")


class BatchLog(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    batch_number = Column(String(64), nullable=False)
    roast_date = Column(DateTime)
    best_by = Column(DateTime)
    qty = Column(Integer, default=0)
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="batches")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    type = Column(String(32), default="bean")  # bean | dairy | packaging | equipment
    contact_name = Column(String(160))
    email = Column(String(255))
    phone = Column(String(64))
    country = Column(String(120))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    green_beans = relationship("GreenBean", back_populates="supplier", cascade="all, delete-orphan")


class GreenBean(Base):
    __tablename__ = "green_beans"
    id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    origin = Column(String(160), nullable=False)
    process = Column(String(64))
    altitude = Column(String(64))
    qty_kg = Column(Float, default=0.0)
    direct_trade = Column(Boolean, default=False)
    arrived_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    supplier = relationship("Supplier", back_populates="green_beans")


class WasteLog(Base):
    __tablename__ = "waste_logs"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty = Column(Integer, default=0)
    reason = Column(String(255))
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")


class Promotion(Base):
    __tablename__ = "promotions"
    id = Column(Integer, primary_key=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    description = Column(String(255))
    discount_type = Column(String(16), default="percent")  # percent | fixed
    discount_value = Column(Float, nullable=False)
    valid_until = Column(DateTime)
    usage_count = Column(Integer, default=0)
    usage_limit = Column(Integer)  # null = unlimited
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True)
    slug = Column(String(160), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    excerpt = Column(String(512))
    body = Column(Text, nullable=False)
    image_url = Column(String(512))
    author = Column(String(160))
    published = Column(Boolean, default=False)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class LoyaltyRule(Base):
    __tablename__ = "loyalty_rules"
    id = Column(Integer, primary_key=True)
    points_per_dollar = Column(Float, default=1.0, nullable=False)
    redemption_threshold = Column(Integer, default=80, nullable=False)
    referral_bonus = Column(Integer, default=50, nullable=False)
    welcome_bonus = Column(Integer, default=50, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =====================================================================
# Owner-only models (Workforce, Finance, Lab, Audit)
# =====================================================================

class Staff(Base):
    """Workforce profile — separate from User for non-app staff."""
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional link to login
    full_name = Column(String(160), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(64))
    position = Column(String(64), default="Barista")  # Barista | Roaster | Admin | Manager
    employment_type = Column(String(32), default="hourly")  # hourly | salaried
    hourly_rate = Column(Float, default=0.0)
    monthly_salary = Column(Float, default=0.0)
    overtime_multiplier = Column(Float, default=1.5)
    bank_account = Column(String(64))  # last 4 digits only — display
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    certifications = Column(Text)  # comma-separated list, simple v1
    health_permit_expires = Column(DateTime)
    hire_date = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    store = relationship("Store")
    shifts = relationship("Shift", back_populates="staff", cascade="all, delete-orphan")
    reviews = relationship("PerformanceReview", back_populates="staff", cascade="all, delete-orphan")


class Shift(Base):
    """Worked shift — drives labor costing & overtime calculations."""
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    start = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=False)
    role = Column(String(64))  # role on this shift (Barista, Bar lead, Roaster…)
    bonus = Column(Float, default=0.0)
    notes = Column(String(255))

    staff = relationship("Staff", back_populates="shifts")
    store = relationship("Store")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    reviewer = Column(String(160))
    rating = Column(Integer, default=3)  # 1-5
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    staff = relationship("Staff", back_populates="reviews")


class Expense(Base):
    """Overhead — rent, utilities, equipment, etc. Drives P&L net."""
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    category = Column(String(64), nullable=False)  # rent | utilities | equipment | marketing | other
    description = Column(String(255))
    vendor = Column(String(160))
    amount = Column(Float, nullable=False)
    incurred_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class TaxSetting(Base):
    __tablename__ = "tax_settings"
    id = Column(Integer, primary_key=True)
    jurisdiction = Column(String(120), default="US")
    tax_rate = Column(Float, default=8.0)  # percent
    tax_id = Column(String(64))             # VAT / EIN
    legal_name = Column(String(255))
    address = Column(String(255))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarginTarget(Base):
    __tablename__ = "margin_targets"
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), unique=True, nullable=False)
    target_pct = Column(Float, nullable=False)  # e.g. 70.0 for 70% margin
    notes = Column(String(255))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category")


class AuditLog(Base):
    """Owner-readable trail of admin actions — who did what, when."""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    actor_email = Column(String(255))
    actor_role = Column(String(16))
    action = Column(String(64), nullable=False)        # e.g. "product.update"
    target_type = Column(String(64))                    # product | order | stock | promo …
    target_id = Column(String(64))
    summary = Column(String(512))                       # human-readable description
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    actor = relationship("User")


class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    size = Column(String(16), default="Medium")
    milk = Column(String(32), default="Whole")
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    code = Column(String(16), unique=True, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    # Lifecycle: pending -> brewing -> ready -> collected | cancelled | refunded
    status = Column(String(32), default="brewing")
    fulfillment = Column(String(32), default="asap")  # asap | scheduled
    pickup_store = Column(String(120))
    promo_code = Column(String(32))
    note = Column(String(255))
    refund_reason = Column(String(255))
    refunded_at = Column(DateTime)
    ready_at = Column(DateTime)
    collected_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(160), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    size = Column(String(16))
    milk = Column(String(32))

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_user_product"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    product = relationship("Product")


class Reward(Base):
    __tablename__ = "rewards"
    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    description = Column(String(255))
    cost_points = Column(Integer, nullable=False)
    image_url = Column(String(512))


class Redemption(Base):
    __tablename__ = "redemptions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    code = Column(String(12), nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="redemptions")
    reward = relationship("Reward")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    body = Column(String(512))
    icon = Column(String(64))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    address = Column(String(255), nullable=False)
    distance_km = Column(Float, default=0.0)
    hours = Column(String(120))
    image_url = Column(String(512))


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    cadence = Column(String(32), default="weekly")
    quantity = Column(Integer, default=1)
    active = Column(Boolean, default=True)
    next_delivery = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    product = relationship("Product")
