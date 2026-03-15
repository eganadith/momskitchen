# Mama's Kitchen – Campus Food Delivery

A production-ready, mobile-first full-stack web application for campus food delivery. Built with Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN UI, Prisma, PostgreSQL, PayHere (Sri Lanka), and Pusher for realtime order tracking.

## Features

- **Time-based menu**: Breakfast (6–8 AM), Lunch (11 AM–2 PM), Dinner (5–8 PM) in Sri Lanka time. Admin can override.
- **Student ordering**: Browse menu, add to cart, checkout with delivery details, pay online (PayHere) or cash on delivery.
- **Realtime order tracking**: Students see live status updates (Preparing → Out for delivery → Delivered) via Pusher.
- **Admin dashboard**: Orders, menu CRUD, settings (override, order limits), daily sales summary.
- **Order limits per meal**: Configurable cap (e.g. 100 dinner orders).
- **WhatsApp notification**: Optional admin notification on new order (env `ADMIN_WHATSAPP`).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN UI, Zustand (cart)
- **Backend**: Next.js API routes, Prisma, PostgreSQL
- **Auth**: JWT (HTTP-only cookie) for admin
- **Payments**: PayHere Sri Lanka (Visa/Mastercard, LankaQR, cash on delivery)
- **Realtime**: Pusher

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- (Optional) [Pusher](https://pusher.com) and [PayHere](https://www.payhere.lk) accounts

### 1. Clone and install

```bash
cd "Mom's kitchen"
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PayHere (optional for local)
PAYHERE_MERCHANT_ID=""
PAYHERE_SECRET=""

# Pusher (optional for local)
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

### 3. Database

```bash
npx prisma db push
npm run db:seed
```

Default admin: **admin@mamaskitchen.lk** / **admin123** (change in production).

### 4. Run

```bash
npm run dev
```

- Student site: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  

## Deployment (Vercel)

1. Connect the repo to Vercel.
2. Add environment variables (see `.env.example`). Use a hosted PostgreSQL (e.g. Vercel Postgres, Neon, Supabase).
3. Set PayHere webhook URL to `https://your-domain.vercel.app/api/payhere/webhook`.
4. Deploy. Run migrations and seed on the production DB (e.g. `npx prisma db push` and `npm run db:seed` from local with `DATABASE_URL` pointing to prod).

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run db:push` – push Prisma schema to DB
- `npm run db:seed` – seed admin, locations, sample menu, config

## Project structure

- `src/app/(student)/` – student pages (home, menu, cart, checkout, order tracking)
- `src/app/(admin)/admin/` – admin login, dashboard, orders, menu, settings
- `src/app/api/` – auth, menu, locations, orders, PayHere webhook
- `src/components/` – UI, layout, menu, cart, order, admin
- `src/lib/` – db, auth, menu-times, payhere, pusher, config
- `src/store/` – cart (Zustand)
- `prisma/` – schema and seed

## License

MIT
