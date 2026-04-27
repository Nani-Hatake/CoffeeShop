from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    auth as auth_router,
    cart as cart_router,
    favorites as favorites_router,
    notifications as notifications_router,
    orders as orders_router,
    products as products_router,
    rewards as rewards_router,
    stores as stores_router,
    subscriptions as subscriptions_router,
    admin_catalog,
    admin_inventory,
    admin_orders,
    admin_customers,
    admin_content,
    admin_marketing,
    admin_analytics,
    owner_workforce,
    owner_finance,
    owner_lab,
    owner_locations,
    owner_reports,
)
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed()
    yield


app = FastAPI(title="Artisan Brew API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "artisan-brew", "version": app.version}


# Customer-facing
app.include_router(auth_router.router)
app.include_router(products_router.router)
app.include_router(cart_router.router)
app.include_router(orders_router.router)
app.include_router(favorites_router.router)
app.include_router(rewards_router.router)
app.include_router(notifications_router.router)
app.include_router(stores_router.router)
app.include_router(subscriptions_router.router)

# Public journal feed (must come after the auth router so OAuth2 endpoint registers first)
app.include_router(admin_content.public_router)

# Admin / Owner ecosystem
app.include_router(admin_catalog.router)
app.include_router(admin_inventory.router)
app.include_router(admin_orders.router)
app.include_router(admin_customers.router)
app.include_router(admin_content.router)
app.include_router(admin_marketing.router)
app.include_router(admin_analytics.router)

# Owner-only ecosystem (workforce, finance, product lab, locations, reports, audit)
app.include_router(owner_workforce.router)
app.include_router(owner_finance.router)
app.include_router(owner_lab.router)
app.include_router(owner_locations.router)
app.include_router(owner_reports.router)
