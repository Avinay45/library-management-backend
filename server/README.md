# Library Management Backend

Express and MongoDB API for the Library Management System.

## Local Development

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set `MONGODB_URI`.

## Vercel Deployment

The backend can deploy from either the repository root or this `server` folder. If Vercel is using the repository root, the root `package.json` and `vercel.json` forward all `/api/*` traffic to `server/api/index.js`.

Add these environment variables:

- `MONGODB_URI`: MongoDB Atlas connection string
- `FRONTEND_URLS`: comma-separated allowed frontend origins, for example `https://your-frontend.vercel.app`
- `ALLOW_VERCEL_PREVIEWS`: `true` if preview deployments should be allowed by CORS

The API is served from `/api`, for example `/api/health`, `/api/books`, `/api/members`, `/api/dashboard`, and `/api/transactions`.
