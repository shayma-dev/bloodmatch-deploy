# BloodMatch — Server (API)

Node/Express API for BloodMatch, a platform that matches eligible blood donors with local requests. Implements secure auth, role-based access, request management, and donor applications. Uses PostgreSQL (Prisma) and JWT with refresh tokens.

## Tech

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Auth (access + refresh)
- bcrypt password hashing
- CORS restricted to frontend origin

## Requirements

- Node.js LTS
- PostgreSQL 14+
- npm
- .env file (see below)

## Environment Variables

Copy `.env.example` to `.env` and fill in your secrets:

```
cp .env.example .env
```

Edit `.env` with your database credentials and strong secrets for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.

## Install, Migrate & Seed

```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed   # (optional, to add sample data)
npm run dev
```

## Testing

- Use Postman or curl to test endpoints:
  - POST /auth/signup (see .env.example for required fields)
  - POST /auth/login
  - GET/PUT /me/profile (requires Bearer token)
- Health check: GET /health

## Notes

- `.env` is in .gitignore and should never be committed.
- See `.env.example` for required environment variables.

## API Endpoints

Auth

- POST /auth/signup
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Profiles

- GET /me/profile
- PUT /me/profile

Requests (Requester-only for create/manage)

- POST /requests
- PATCH /requests/:id/status (Resolved | Cancelled)
- GET /my/requests
- GET /requests/:id (authorized)

Matching / Discovery (Donor-only)

- GET /requests?bloodType=&city=&country= → Open requests only

Applications (Donor-only unless noted)

- POST /requests/:id/apply
- POST /applications/:id/withdraw
- GET /requests/:id/applicants (Requester-only)

## Security Notes

- Hash passwords with bcrypt
- Use HTTP-only cookies or Authorization headers for tokens
- Restrict CORS to the frontend domain
- Validate inputs on all POST/PATCH routes
