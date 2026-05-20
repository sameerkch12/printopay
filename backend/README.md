# PrintoPay Backend

Production TypeScript Express API with MongoDB, Cloudinary PDF uploads, shop-owner auth, admin auth, OTP verification, and print job status management.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill MongoDB Atlas, Cloudinary, JWT, and admin setup credentials.
3. Install dependencies:

```bash
npm install
```

4. Start in development:

```bash
npm run dev
```

## Main Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/shop-owner/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/admin/setup`
- `POST /api/v1/documents/upload`
- `GET /api/v1/documents/:id/signed-url`
- `POST /api/v1/print-jobs`
- `GET /api/v1/print-jobs/shop/mine`
- `POST /api/v1/print-jobs/:id/verify-otp`
- `PATCH /api/v1/print-jobs/:id/status`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/shops`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/print-jobs`

Upload field name: `file`

## Admin Setup

Set `ADMIN_SETUP_KEY` in `.env`, then create the first admin from the shop dashboard Admin Setup tab.
