# Resep Nusantara API

SaaS bergaya OpenRouter/WeatherAPI yang menyediakan data resep masakan
tradisional Indonesia kepada pihak ketiga melalui API Key.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Salin `.env.example` menjadi `.env` dan isi `DATABASE_URL` (Supabase Postgres)
   serta `JWT_SECRET`.
3. Buat schema dan isi data awal:
   ```
   npm run seed
   ```
4. Jalankan server lokal:
   ```
   npm run dev
   ```

## Alur Penggunaan

1. `POST /auth/register` lalu `POST /auth/login` untuk mendapatkan JWT.
2. Gunakan JWT (`Authorization: Bearer <token>`) untuk generate API key via
   `POST /dashboard/api-keys`.
3. Gunakan API key (`x-api-key: <key>`) untuk mengakses endpoint
   `/api/v1/recipes`, `/api/v1/ingredients`, dst.

## Endpoint


## Deploy ke Vercel

Project sudah dilengkapi `vercel.json` sehingga `api/index.js` bisa langsung
di-deploy sebagai serverless function. Jangan lupa set environment variable
`DATABASE_URL` dan `JWT_SECRET` di dashboard Vercel.
