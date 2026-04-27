# Artisan Brew &mdash; Premium Coffee App

A full-stack reference implementation of a premium coffee mobile-app experience.

- **Backend** &mdash; Python · FastAPI · SQLAlchemy · SQLite · JWT auth
- **Frontend** &mdash; React · Vite · React Router · Tailwind (via CDN, mirroring the Artisan Brew design system)
- **Design source of truth** &mdash; the existing high-fidelity HTML mocks in [`docs/`](docs/), now wired to a working app

---

## Project layout

```
backend/                FastAPI + SQLAlchemy + SQLite
  app/
    main.py             ASGI app + CORS + lifespan seed
    config.py           Pydantic settings (.env)
    database.py         engine + session
    models.py           User, Product, CartItem, Order, Favorite,
                        Reward, Redemption, Notification, Store,
                        Subscription
    schemas.py          Pydantic request/response models
    auth.py             bcrypt + JWT
    seed.py             Demo data (idempotent)
    routers/            auth, products, cart, orders, favorites,
                        rewards, notifications, stores, subscriptions

frontend/               Vite + React + React Router
  index.html            Tailwind CDN with the Artisan Brew tokens
  src/
    main.jsx            App bootstrap (providers)
    App.jsx             All routes (32+ screens)
    api.js              fetch wrapper that talks to /api/*
    contexts/           Auth, Cart, Toast
    components/         AppShell, TopBar, BottomNav, MobileFrame,
                        RequireAuth, StaticScreen
    pages/              Welcome, SignIn, Join, VerifyEmail,
                        Home, Search, ProductDetail, Cart,
                        OrderSuccess, Orders, Profile,
                        Favorites, Notifications, Loyalty,
                        StoreLocator, Subscriptions
  public/screens/       Body HTML extracted from /docs for static-only screens
                        (gifts, master-class, settings, help, etc.)

docs/                   Original high-fidelity mocks (untouched)
screens/                Hub-rendered standalone screens
index.html              Hub page (visual catalog of all 32 screens)
```

---

## Running it locally

### 1) Start the backend (port 8000)

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux / Git Bash
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # optional, for production secrets

uvicorn app.main:app --reload --port 8000
```

On first boot the app:

- creates `artisan_brew.db` (SQLite)
- seeds categories, products, rewards, stores
- creates a demo user **`barista@artisan.coffee`** / **`ritual123`** (Connoisseur tier, 420 points)

API docs are auto-generated at <http://127.0.0.1:8000/docs>.

### 2) Start the frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite dev server proxies `/api/*` to the FastAPI server, so no CORS gymnastics in dev.

---

## End-to-end demo flow

1. **/welcome** &rarr; Join the ritual or sign in
2. **/sign-in** &rarr; Pre-filled with the demo credentials
3. **/home** &rarr; Browse drinks (filter by category, all products from the API)
4. **/product/velvet-espresso** &rarr; Pick size + milk, add to bag, save as favourite
5. **/cart** &rarr; Adjust quantities, remove items, see live subtotal/tax/total
6. **Confirm order** &rarr; `/order/:id/success` shows the live order code
7. **/orders** &rarr; Persistent order history
8. **/loyalty** &rarr; Redeem rewards (deducts points; mints a redemption code)
9. **/notifications** &rarr; All actions write notifications server-side
10. **/profile** &rarr; Account stats + jump-off to every other screen

Static-design screens (gifts, master-class, store locator embed, etc.) render the
original `docs/<slug>/code.html` body content via the `<StaticScreen>` component
&mdash; preserving pixel-perfect visual fidelity while running inside the React app.

---

## API surface

| Method | Path                                  | Auth | Notes |
| ------ | ------------------------------------- | :--: | ----- |
| GET    | `/api/health`                         | &mdash; | liveness |
| POST   | `/api/auth/signup`                    | &mdash; | returns JWT |
| POST   | `/api/auth/login`                     | &mdash; | returns JWT |
| POST   | `/api/auth/verify`                    | &mdash; | dev: any 6-digit code |
| POST   | `/api/auth/resend-code`               | &mdash; | rotates verification code |
| GET    | `/api/auth/me`                        | &check; | profile + points + tier |
| GET    | `/api/categories`                     | &mdash; |  |
| GET    | `/api/products?category=&q=&featured=`| &mdash; | filterable |
| GET    | `/api/products/{slug}`                | &mdash; | by slug or numeric id |
| GET    | `/api/cart`                           | &check; | line totals + tax |
| POST   | `/api/cart/items`                     | &check; | add / merge |
| PATCH  | `/api/cart/items/{id}`                | &check; | qty / size / milk |
| DELETE | `/api/cart/items/{id}`                | &check; |  |
| DELETE | `/api/cart`                           | &check; | clear |
| GET    | `/api/orders`                         | &check; |  |
| GET    | `/api/orders/{id}`                    | &check; |  |
| POST   | `/api/orders/checkout`                | &check; | empties cart, awards points, files notification |
| GET    | `/api/favorites`                      | &check; |  |
| POST   | `/api/favorites/{product_id}`         | &check; | idempotent |
| DELETE | `/api/favorites/{product_id}`         | &check; |  |
| GET    | `/api/rewards`                        | &mdash; |  |
| POST   | `/api/rewards/{id}/redeem`            | &check; | spends points, returns code |
| GET    | `/api/rewards/me/redemptions`         | &check; |  |
| GET    | `/api/notifications`                  | &check; |  |
| POST   | `/api/notifications/{id}/read`        | &check; |  |
| POST   | `/api/notifications/read-all`         | &check; |  |
| GET    | `/api/stores`                         | &mdash; |  |
| GET    | `/api/subscriptions`                  | &check; |  |
| POST   | `/api/subscriptions`                  | &check; | creates schedule |
| DELETE | `/api/subscriptions/{id}`             | &check; | pauses |

Auth is `Bearer <jwt>` &mdash; the React API client attaches it automatically when present.

---

## Configuration

`backend/.env` (copy from `.env.example`):

```
SECRET_KEY=...
DATABASE_URL=sqlite:///./artisan_brew.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

To re-seed from scratch:

```bash
cd backend
rm artisan_brew.db && uvicorn app.main:app --reload --port 8000
```

---

## Production build (frontend)

```bash
cd frontend
npm run build      # outputs to dist/
npm run preview    # serve dist/ locally
```

Serve `dist/` from any static host. Point the React API client to your
FastAPI deployment (the dev proxy is replaced in production by setting up
the backend behind the same domain or by enabling CORS for the frontend's
origin in `CORS_ORIGINS`).
