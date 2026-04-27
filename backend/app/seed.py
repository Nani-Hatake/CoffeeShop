from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import (
    AuditLog, BatchLog, Category, Expense, GreenBean, JournalEntry, LoyaltyRule,
    MarginTarget, Notification, PerformanceReview, Product, Promotion, Reward,
    Shift, Staff, Stock, Store, Supplier, TaxSetting, User, WasteLog,
)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def seed() -> None:
    init_db()
    db: Session = SessionLocal()
    try:
        # ---------- Categories ----------
        if db.query(Category).count() == 0:
            db.add_all([
                Category(name="Classic",   slug="classic",   sort_order=1),
                Category(name="Specialty", slug="specialty", sort_order=2),
                Category(name="Seasonal",  slug="seasonal",  sort_order=3),
                Category(name="Beans",     slug="beans",     sort_order=4),
            ])
            db.flush()
        cats = {c.slug: c for c in db.query(Category).all()}

        # ---------- Products ----------
        if db.query(Product).count() == 0:
            products = [
                Product(slug="velvet-espresso", name="Velvet Espresso",
                        subtitle="Double shot, dark roast",
                        description="A rich, full-bodied double shot pulled from our signature dark roast. Notes of dark chocolate, brown sugar, and toasted hazelnut.",
                        category_id=cats["classic"].id, price=4.50, rating=4.8, review_count=312,
                        roast="Dark", origin="Brazil & Colombia", process="Washed",
                        altitude="1200-1500 MASL",
                        tasting_notes="Dark chocolate, brown sugar, hazelnut",
                        image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuDDx75dobwEI4P4gs3X7qn8BaIHPGjNwp19YcXPiUw6MBXwa8sjNUNFkEyI2_RTEWFC5u1AJODxhF4BlV5PKyb9QTR7pyhDHpMXo4cpvcHwEuJV5bJ0a3mu2VAczNfdP8-lPofRuEF4-a0M2WIhb_GZgUVh634t4gx_c8SawQCcvdEJVbW86Ht3FS0U-h1fAQzKpyHhyaq50DoMdCbZ8veD17SJyRmJqwkFC3tZHr-fpPgrB0T7nkQiCaI_Sxxtl6q5T04cmG5mRw8",
                        is_featured=True),
                Product(slug="signature-latte", name="Signature Latte",
                        subtitle="Oat milk, vanilla bean",
                        description="Velvety oat milk, a kiss of Madagascar vanilla, layered over our house espresso.",
                        category_id=cats["specialty"].id, price=6.25, rating=4.9, review_count=521,
                        roast="Medium", origin="House blend", process="Washed",
                        altitude="1500-1800 MASL",
                        tasting_notes="Vanilla, caramel, cream",
                        image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuCwM9SP9k168_yODAhJKCf-F1K7zS0AG_qTpiQVHifpxW2gWvOWKzXkWHgNg_s_n1KmzAEiFdH0N7X6eIiW8uMKxEQrebNsjUQ62myj_H3fKSmXRV1-zt-QO5VQ03ZUoJKV66RbbPFEiAqQzrasbqAz5bPVfK_y6-vxthT2Tg8Dm5fmQt0oRmcD34UMEAaJrLdn_qdd1Ivelahh6nkGGK_kS10HDxB6Ijx4wABZ9tO41YCfVmcxe1RJEZdMXrxNb9E_gJHakqFSo9U",
                        is_featured=True),
                Product(slug="ethiopian-bloom", name="Ethiopian Bloom",
                        subtitle="Hand-poured, floral",
                        description="A single-origin pour over from the misty highlands of Yirgacheffe. Floral, citrus, and a long honeyed finish.",
                        category_id=cats["specialty"].id, price=5.75, rating=4.9, review_count=287,
                        roast="Light", origin="Yirgacheffe, Ethiopia", process="Natural",
                        altitude="1900-2200 MASL",
                        tasting_notes="Jasmine, bergamot, honey",
                        image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuD1BQEWjpFqHlsC6pfYqCD33cXgIPgDDwmZ_uXY2mD0ENEAERTyJmAVcx6phmp579mW9eLNK2XE6F7fsBY--nOnOhW6vKfq1rXLEHJMwGQZbq0VbmC0GpzVc0MORgK3orWTs1USInlm_pd3nOx34d_NHwF0d3R8bMCDZx8nGQkiZtu8HE113ArsJa7mcQNDB5nraWmRX-uaQI1z8HP65GLYRcBzl9PWaVThZEuPXWVDByqg2hCyqRQIjn5g1b0qNTaLNcBKhb56isk",
                        is_featured=True),
                Product(slug="cold-brew-24hr", name="24hr Cold Brew",
                        subtitle="Steeped long, low acid",
                        description="Slow steeped over 24 hours for a smooth, naturally sweet body with low acidity.",
                        category_id=cats["classic"].id, price=5.00, rating=4.7, review_count=412,
                        roast="Medium-Dark", origin="Colombia", process="Washed",
                        altitude="1400-1700 MASL",
                        tasting_notes="Cocoa, molasses, plum",
                        image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuALoJeKjxgx7ZYfDD2k1ad3aTywOMANqMsZeoGq6Qk15iYDaJyuoIAFFJAG8RueNCiwqkNrNOgT8p5HS8fQdxVl2Tnb-bAh9223nuXoxx2uy8k6-Os1VHyI0bZqo1OVHtRsWimZndvLwncmHTB9RiSXcoE7uckcStYO4N8PEgOCeiEiB2KllPdKquibUs56fE-A2iRu_g34geGScL8c0oeFKUv0PsxwRL_8TRWD7o954w-ZJ5lHpeadgyg5afPUycWLKbpB-aYF9H0",
                        is_featured=False),
                Product(slug="flat-white", name="Flat White",
                        subtitle="Microfoam, double ristretto",
                        description="A silky microfoam poured over a double ristretto. Balanced, smooth, and quietly powerful.",
                        category_id=cats["classic"].id, price=5.25, rating=4.8, review_count=623,
                        roast="Medium", origin="House blend", process="Washed",
                        tasting_notes="Milk chocolate, caramel, almond",
                        image_url="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
                        is_featured=True),
                Product(slug="seasonal-maple", name="Maple Cinnamon Latte",
                        subtitle="Limited release",
                        description="Real maple syrup, Saigon cinnamon, and our winter espresso blend.",
                        category_id=cats["seasonal"].id, price=6.75, rating=4.6, review_count=98,
                        roast="Dark", origin="House blend", process="Washed",
                        tasting_notes="Maple, cinnamon, vanilla",
                        image_url="https://images.unsplash.com/photo-1572286258217-215cf8e2cf30?auto=format&fit=crop&w=900&q=80",
                        is_seasonal=True, is_limited=True),
                Product(slug="bean-yirgacheffe-250g", name="Yirgacheffe Beans 250g",
                        subtitle="Single origin · whole bean",
                        description="Bring the bloom home. Roasted weekly and shipped within 48 hours.",
                        category_id=cats["beans"].id, price=18.00, rating=5.0, review_count=156,
                        roast="Light", origin="Yirgacheffe, Ethiopia", process="Natural",
                        altitude="1900-2200 MASL",
                        tasting_notes="Jasmine, bergamot, honey",
                        image_url="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80"),
                Product(slug="bean-house-blend-250g", name="House Blend Beans 250g",
                        subtitle="Versatile · whole bean",
                        description="Our signature blend — equally great as espresso, drip, or cold brew.",
                        category_id=cats["beans"].id, price=16.00, rating=4.8, review_count=482,
                        roast="Medium-Dark", origin="Brazil, Colombia, Guatemala", process="Mixed",
                        tasting_notes="Cocoa, hazelnut, brown sugar",
                        image_url="https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=900&q=80"),
            ]
            db.add_all(products)
            db.flush()

        # ---------- Stock for every product ----------
        for product in db.query(Product).all():
            if not product.stock:
                # Vary on_hand to make analytics interesting
                preset = {
                    "velvet-espresso": (120, 30),
                    "signature-latte": (80, 25),
                    "ethiopian-bloom": (8, 15),     # low stock
                    "cold-brew-24hr": (45, 20),
                    "flat-white": (95, 30),
                    "seasonal-maple": (0, 10),       # out of stock
                    "bean-yirgacheffe-250g": (24, 10),
                    "bean-house-blend-250g": (62, 15),
                }
                on_hand, threshold = preset.get(product.slug, (50, 10))
                db.add(Stock(product_id=product.id, on_hand=on_hand, low_threshold=threshold))

        # ---------- Rewards ----------
        if db.query(Reward).count() == 0:
            db.add_all([
                Reward(title="Free Espresso", description="A complimentary double shot of Velvet Espresso.", cost_points=80,
                       image_url="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80"),
                Reward(title="Free Signature Latte", description="On us — your favourite oat milk vanilla.", cost_points=120,
                       image_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80"),
                Reward(title="250g of beans", description="Choose any single-origin bag, on the house.", cost_points=240,
                       image_url="https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=600&q=80"),
                Reward(title="Roast Master Class seat", description="One spot in our next V60 master class.", cost_points=400,
                       image_url="https://images.unsplash.com/photo-1442550528053-c431ecb55509?auto=format&fit=crop&w=600&q=80"),
            ])

        # ---------- Stores ----------
        if db.query(Store).count() == 0:
            db.add_all([
                Store(name="Artisan Brew · Riverside", address="142 River St, Mill District", distance_km=0.4,
                      hours="Mon–Sun · 7am – 8pm",
                      image_url="https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80"),
                Store(name="Artisan Brew · Northgate", address="9 Northgate Lane", distance_km=1.6,
                      hours="Mon–Fri · 6:30am – 7pm",
                      image_url="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=900&q=80"),
                Store(name="Artisan Brew · The Roastery", address="22 Foundry Yard", distance_km=3.1,
                      hours="Wed–Sun · 8am – 6pm",
                      image_url="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80"),
            ])

        # ---------- Suppliers ----------
        if db.query(Supplier).count() == 0:
            db.add_all([
                Supplier(name="Highland Co-op (Ethiopia)", type="bean",
                         contact_name="Tigist Bekele", email="orders@highland-coop.et",
                         country="Ethiopia",
                         notes="Direct trade · Yirgacheffe and Sidamo lots."),
                Supplier(name="Andes Family Farms", type="bean",
                         contact_name="Mateo Restrepo", email="hola@andesfamilia.co",
                         country="Colombia",
                         notes="Mixed-process Caturra & Castillo from Huila."),
                Supplier(name="Northern Pasture Dairy", type="dairy",
                         contact_name="Eve Larsson", email="trade@northernpasture.com",
                         country="Sweden", notes="Oat milk, cream, microfoam blends."),
                Supplier(name="Saigon Spice Co.", type="packaging",
                         contact_name="Linh Nguyen", email="hello@saigonspice.vn",
                         country="Vietnam", notes="Compostable bags, kraft sleeves."),
            ])
            db.flush()

        # ---------- Green beans inventory ----------
        if db.query(GreenBean).count() == 0:
            sup = {s.name: s for s in db.query(Supplier).all()}
            db.add_all([
                GreenBean(supplier_id=sup["Highland Co-op (Ethiopia)"].id,
                          origin="Yirgacheffe — Konga washing station",
                          process="Natural", altitude="1900-2100 MASL",
                          qty_kg=180.0, direct_trade=True,
                          arrived_at=datetime.utcnow() - timedelta(days=14)),
                GreenBean(supplier_id=sup["Highland Co-op (Ethiopia)"].id,
                          origin="Sidamo — Bensa zone",
                          process="Washed", altitude="1850-2000 MASL",
                          qty_kg=120.0, direct_trade=True,
                          arrived_at=datetime.utcnow() - timedelta(days=21)),
                GreenBean(supplier_id=sup["Andes Family Farms"].id,
                          origin="Huila — Pitalito",
                          process="Washed", altitude="1500-1750 MASL",
                          qty_kg=240.0, direct_trade=True,
                          arrived_at=datetime.utcnow() - timedelta(days=7)),
            ])

        # ---------- Batches for each main product ----------
        if db.query(BatchLog).count() == 0:
            now = datetime.utcnow()
            for product in db.query(Product).filter(Product.category_id.in_([cats["beans"].id, cats["specialty"].id])).all():
                db.add(BatchLog(
                    product_id=product.id,
                    batch_number=f"AB-{now.strftime('%Y%m')}-{product.id:03d}",
                    roast_date=now - timedelta(days=4),
                    best_by=now + timedelta(days=21),
                    qty=40,
                    notes="Standard production roast · within profile.",
                ))

        # ---------- Promotions ----------
        if db.query(Promotion).count() == 0:
            db.add_all([
                Promotion(code="WELCOME10", description="10% off the first order",
                          discount_type="percent", discount_value=10.0,
                          valid_until=datetime.utcnow() + timedelta(days=180),
                          usage_limit=None),
                Promotion(code="REFER5", description="$5 off when a friend joins via your link",
                          discount_type="fixed", discount_value=5.0,
                          valid_until=datetime.utcnow() + timedelta(days=365)),
                Promotion(code="MAPLEDROP", description="Seasonal Maple Cinnamon launch promo",
                          discount_type="percent", discount_value=15.0,
                          valid_until=datetime.utcnow() + timedelta(days=30),
                          usage_limit=200),
            ])

        # ---------- Loyalty rules singleton ----------
        if db.query(LoyaltyRule).count() == 0:
            db.add(LoyaltyRule(points_per_dollar=1.0, redemption_threshold=80,
                               referral_bonus=50, welcome_bonus=50))

        # ---------- Journal entries ----------
        if db.query(JournalEntry).count() == 0:
            now = datetime.utcnow()
            db.add_all([
                JournalEntry(
                    slug="why-yirgacheffe-blooms",
                    title="Why Yirgacheffe blooms in spring",
                    excerpt="A note on the cycle that shapes our most floral pour.",
                    body=("In the misty highlands above 1,900 metres, Yirgacheffe coffee cherries ripen "
                          "slowly under shade trees. The result is a cup that drinks more like a tea "
                          "than a coffee — jasmine, bergamot, and a long honeyed finish.\n\n"
                          "We source ours direct from the Konga washing station, where the picking "
                          "windows are tight and the lots are kept separate by altitude band."),
                    image_url="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1600&q=80",
                    author="Mira Hale, Head Roaster",
                    published=True,
                    published_at=now - timedelta(days=3),
                ),
                JournalEntry(
                    slug="the-bloom-30-seconds",
                    title="The bloom — why those first 30 seconds matter",
                    excerpt="A short essay on patience, gas, and the V60.",
                    body=("Pour over coffee is mostly waiting. The bloom is the brewer's first act of "
                          "patience: 30 seconds of CO₂ escaping the grounds before water can extract "
                          "evenly. Skip it and your cup will taste sour. Honour it and the rest of the "
                          "brew almost takes care of itself."),
                    image_url="https://images.unsplash.com/photo-1442550528053-c431ecb55509?auto=format&fit=crop&w=1600&q=80",
                    author="Mira Hale, Head Roaster",
                    published=True,
                    published_at=now - timedelta(days=10),
                ),
                JournalEntry(
                    slug="winter-roast-drop",
                    title="Winter roast — coming soon",
                    excerpt="Maple, cinnamon, and an espresso blend built for cold mornings.",
                    body="Draft post — not yet published.",
                    author="Mira Hale, Head Roaster",
                    published=False,
                ),
            ])

        # ---------- Waste log (some entries for the analytics view) ----------
        if db.query(WasteLog).count() == 0:
            yc = db.query(Product).filter(Product.slug == "bean-yirgacheffe-250g").first()
            sm = db.query(Product).filter(Product.slug == "seasonal-maple").first()
            if yc:
                db.add(WasteLog(product_id=yc.id, qty=2, reason="Past best-by date",
                                cost=36.0, created_at=datetime.utcnow() - timedelta(days=4)))
            if sm:
                db.add(WasteLog(product_id=sm.id, qty=1, reason="Spilled during prep",
                                cost=6.75, created_at=datetime.utcnow() - timedelta(days=1)))

        # ---------- Demo customer ----------
        if not db.query(User).filter(User.email == "barista@artisan.coffee").first():
            demo = User(
                email="barista@artisan.coffee",
                full_name="Mira Hale",
                password_hash=hash_password("ritual123"),
                is_verified=True, points=420, tier="Connoisseur", role="customer",
                verification_code="000000",
            )
            db.add(demo)
            db.flush()
            db.add_all([
                Notification(user_id=demo.id, title="Your morning ritual awaits",
                             body="Tap to brew today's signature.", icon="local_cafe"),
                Notification(user_id=demo.id, title="+18 ritual points earned",
                             body="From your last order at Riverside.", icon="stars",
                             is_read=True),
                Notification(user_id=demo.id, title="V60 Master Class — Sat 9am",
                             body="Your seat is reserved. Bring a curious palate.", icon="event"),
            ])

        # ---------- Admin (Head Roaster) user ----------
        if not db.query(User).filter(User.email == "admin@artisan.coffee").first():
            db.add(User(
                email="admin@artisan.coffee",
                full_name="Tomás Reyes",
                password_hash=hash_password("espresso"),
                is_verified=True, role="admin", tier="Master", points=0,
            ))

        # ---------- Owner (Business Strategist) user ----------
        if not db.query(User).filter(User.email == "owner@artisan.coffee").first():
            db.add(User(
                email="owner@artisan.coffee",
                full_name="Lior Vance",
                password_hash=hash_password("strategy"),
                is_verified=True, role="owner", tier="Master", points=0,
            ))

        # ---------- COGS for existing products (for Owner P&L + margins) ----------
        for p in db.query(Product).all():
            if p.cost_per_unit == 0:
                # Roughly 30-45% of price as COGS; varies by category for realism
                if p.category and p.category.slug == "beans":
                    p.cost_per_unit = round(p.price * 0.45, 2)
                elif p.category and p.category.slug == "seasonal":
                    p.cost_per_unit = round(p.price * 0.40, 2)
                else:
                    p.cost_per_unit = round(p.price * 0.32, 2)

        # ---------- Tax setting singleton ----------
        if db.query(TaxSetting).count() == 0:
            db.add(TaxSetting(
                jurisdiction="US-WA",
                tax_rate=8.0,
                tax_id="EIN-12-3456789",
                legal_name="Artisan Brew Coffee Co.",
                address="142 River St, Mill District",
            ))

        # ---------- Margin targets (Owner Pricing Strategy) ----------
        if db.query(MarginTarget).count() == 0:
            cat_map = {c.slug: c for c in db.query(Category).all()}
            db.add_all([
                MarginTarget(category_id=cat_map["classic"].id, target_pct=70.0,
                             notes="Bar drinks should clear 70% margin."),
                MarginTarget(category_id=cat_map["specialty"].id, target_pct=72.0,
                             notes="Premium specialty drinks command higher margin."),
                MarginTarget(category_id=cat_map["seasonal"].id, target_pct=65.0,
                             notes="Seasonal items have higher ingredient cost."),
                MarginTarget(category_id=cat_map["beans"].id, target_pct=55.0,
                             notes="Retail beans target 55% margin."),
            ])

        # ---------- Sandbox products (Owner New Product Lab) ----------
        if db.query(Product).filter(Product.is_sandbox.is_(True)).count() == 0:
            cat_map = {c.slug: c for c in db.query(Category).all()}
            sandbox = [
                Product(slug="lab-honey-chai", name="Honey Saffron Chai (lab)",
                        subtitle="Prototype · winter R&D",
                        description="A lab-only chai latte with raw honey, saffron threads, and our winter espresso.",
                        category_id=cat_map["seasonal"].id, price=7.50, cost_per_unit=2.40,
                        roast="Dark", origin="House blend", process="Washed",
                        tasting_notes="Saffron, honey, cardamom",
                        image_url="https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80",
                        is_sandbox=True, is_available=False),
                Product(slug="lab-merch-mug", name="Atelier Ceramic Mug (lab)",
                        subtitle="Prototype · merchandise",
                        description="Hand-thrown ceramic mug, glazed in our signature Espresso brown.",
                        category_id=cat_map["beans"].id, price=24.00, cost_per_unit=8.00,
                        image_url="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
                        is_sandbox=True, is_available=False),
            ]
            db.add_all(sandbox)
            db.flush()
            for p in sandbox:
                if not p.stock:
                    db.add(Stock(product_id=p.id, on_hand=0, low_threshold=10))

        # ---------- Staff (Owner Workforce) ----------
        if db.query(Staff).count() == 0:
            stores_by_name = {s.name: s for s in db.query(Store).all()}
            db.add_all([
                Staff(full_name="Sofia Marin", email="sofia.marin@artisan.coffee",
                      phone="+1 555 0142", position="Barista",
                      employment_type="hourly", hourly_rate=22.0, overtime_multiplier=1.5,
                      bank_account="****4421",
                      store_id=stores_by_name["Artisan Brew · Riverside"].id,
                      certifications="Latte Art Level 2, Food Handler",
                      health_permit_expires=datetime.utcnow() + timedelta(days=180),
                      hire_date=datetime.utcnow() - timedelta(days=420),
                      notes="Top performer · floats between Riverside and Northgate."),
                Staff(full_name="Jules Okafor", email="jules.okafor@artisan.coffee",
                      phone="+1 555 0188", position="Bar lead",
                      employment_type="hourly", hourly_rate=27.0, overtime_multiplier=1.5,
                      bank_account="****8810",
                      store_id=stores_by_name["Artisan Brew · Northgate"].id,
                      certifications="SCA Barista Level 3, Latte Art Level 3, Health & Safety",
                      health_permit_expires=datetime.utcnow() + timedelta(days=320),
                      hire_date=datetime.utcnow() - timedelta(days=780)),
                Staff(full_name="Tomás Reyes", email="admin@artisan.coffee",
                      phone="+1 555 0107", position="Head Roaster",
                      employment_type="salaried", hourly_rate=0.0, monthly_salary=6800.0,
                      bank_account="****2208",
                      store_id=stores_by_name["Artisan Brew · The Roastery"].id,
                      certifications="Q-Grader, SCA Roaster Level 2",
                      hire_date=datetime.utcnow() - timedelta(days=1100),
                      notes="Owns roasting profile + supplier relationships."),
                Staff(full_name="Eve Park", email="eve.park@artisan.coffee",
                      phone="+1 555 0250", position="Roaster",
                      employment_type="hourly", hourly_rate=24.0, overtime_multiplier=1.5,
                      bank_account="****5601",
                      store_id=stores_by_name["Artisan Brew · The Roastery"].id,
                      certifications="SCA Roaster Level 1",
                      hire_date=datetime.utcnow() - timedelta(days=210)),
            ])
            db.flush()
            # Link admin user to its Staff record
            admin_user = db.query(User).filter(User.email == "admin@artisan.coffee").first()
            if admin_user:
                tomas = db.query(Staff).filter(Staff.email == "admin@artisan.coffee").first()
                if tomas:
                    tomas.user_id = admin_user.id

        # ---------- Sample shifts for the last two weeks ----------
        if db.query(Shift).count() == 0:
            staff_rows = {s.email: s for s in db.query(Staff).all()}
            now = datetime.utcnow()
            # Sofia — 5 shifts of 8h
            for i in range(1, 11):
                start = now - timedelta(days=i, hours=9)
                db.add(Shift(
                    staff_id=staff_rows["sofia.marin@artisan.coffee"].id,
                    store_id=staff_rows["sofia.marin@artisan.coffee"].store_id,
                    start=start, end=start + timedelta(hours=8),
                    role="Barista",
                ))
            # Jules — 5 shifts of 9h (a little OT)
            for i in range(1, 8):
                start = now - timedelta(days=i, hours=10)
                db.add(Shift(
                    staff_id=staff_rows["jules.okafor@artisan.coffee"].id,
                    store_id=staff_rows["jules.okafor@artisan.coffee"].store_id,
                    start=start, end=start + timedelta(hours=9),
                    role="Bar lead",
                ))
            # Eve — 4 shifts of 8h at Roastery
            for i in range(1, 6):
                start = now - timedelta(days=i*2, hours=8)
                db.add(Shift(
                    staff_id=staff_rows["eve.park@artisan.coffee"].id,
                    store_id=staff_rows["eve.park@artisan.coffee"].store_id,
                    start=start, end=start + timedelta(hours=8),
                    role="Roaster",
                ))

        # ---------- Performance reviews ----------
        if db.query(PerformanceReview).count() == 0:
            sofia = db.query(Staff).filter(Staff.email == "sofia.marin@artisan.coffee").first()
            if sofia:
                db.add(PerformanceReview(
                    staff_id=sofia.id, reviewer="Lior Vance", rating=5,
                    summary="Outstanding latte art consistency. Mentoring new hires effectively.",
                ))
            jules = db.query(Staff).filter(Staff.email == "jules.okafor@artisan.coffee").first()
            if jules:
                db.add(PerformanceReview(
                    staff_id=jules.id, reviewer="Lior Vance", rating=4,
                    summary="Solid bar lead. Could improve on inventory hand-off documentation.",
                ))

        # ---------- Expenses (Owner finance) ----------
        if db.query(Expense).count() == 0:
            now = datetime.utcnow()
            db.add_all([
                Expense(category="rent", description="Riverside lease", vendor="Mill District Holdings",
                        amount=4800.0, incurred_at=now - timedelta(days=2)),
                Expense(category="rent", description="Northgate lease", vendor="Northgate Properties",
                        amount=3600.0, incurred_at=now - timedelta(days=2)),
                Expense(category="rent", description="Roastery lease", vendor="Foundry Yard LLC",
                        amount=2900.0, incurred_at=now - timedelta(days=2)),
                Expense(category="utilities", description="Power & water — all locations", vendor="City Utilities",
                        amount=1240.0, incurred_at=now - timedelta(days=8)),
                Expense(category="equipment", description="Espresso machine annual service", vendor="La Marzocco Repair",
                        amount=850.0, incurred_at=now - timedelta(days=14)),
                Expense(category="marketing", description="Spring promo campaign", vendor="Atelier Studio",
                        amount=1800.0, incurred_at=now - timedelta(days=20)),
                Expense(category="marketing", description="Yelp + Instagram boosts", vendor="Various",
                        amount=420.0, incurred_at=now - timedelta(days=6)),
                Expense(category="other", description="Admin software subscriptions", vendor="Notion, 1Password, Slack",
                        amount=185.0, incurred_at=now - timedelta(days=3)),
            ])

        # ---------- Loyalty rules singleton (shadow ensure) ----------
        if db.query(LoyaltyRule).count() == 0:
            db.add(LoyaltyRule(points_per_dollar=1.0, redemption_threshold=80,
                               referral_bonus=50, welcome_bonus=50))

        # ---------- Audit log seed entries ----------
        if db.query(AuditLog).count() == 0:
            owner_user = db.query(User).filter(User.email == "owner@artisan.coffee").first()
            admin_user = db.query(User).filter(User.email == "admin@artisan.coffee").first()
            now = datetime.utcnow()
            entries = []
            if admin_user:
                entries += [
                    AuditLog(actor_id=admin_user.id, actor_email=admin_user.email,
                             actor_role="admin", action="product.update",
                             target_type="product", target_id="velvet-espresso",
                             summary="Updated Velvet Espresso · price",
                             created_at=now - timedelta(days=2, hours=3)),
                    AuditLog(actor_id=admin_user.id, actor_email=admin_user.email,
                             actor_role="admin", action="stock.update",
                             target_type="product", target_id="3",
                             summary="on_hand=8, threshold=15",
                             created_at=now - timedelta(days=1, hours=2)),
                    AuditLog(actor_id=admin_user.id, actor_email=admin_user.email,
                             actor_role="admin", action="waste.create",
                             target_type="product", target_id="bean-yirgacheffe-250g",
                             summary="2× wasted · $36.00 · Past best-by date",
                             created_at=now - timedelta(days=4, hours=1)),
                ]
            if owner_user:
                entries.append(
                    AuditLog(actor_id=owner_user.id, actor_email=owner_user.email,
                             actor_role="owner", action="staff.enroll",
                             target_type="staff", target_id="sofia.marin@artisan.coffee",
                             summary="Enrolled Sofia Marin as Barista",
                             created_at=now - timedelta(days=420)),
                )
            db.add_all(entries)

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
