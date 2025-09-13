# BloodMatch

BloodMatch is a PERN web platform that connects eligible blood donors with nearby requests from hospitals and patients. It enforces a 54‑day cooldown for donor safety and matches by blood type and location.

## Key Features
- Role-based accounts: Donor or Requester (Hospital/Patient)
- Donor profile: blood type, last donation date, city/country, auto eligibility
- Create/manage requests: blood type, units, urgency, description, status
- Matching: donors see Open requests for their blood type in the same city/country
- Applications: eligible donors apply; requesters view applicants with contact info
- Request lifecycle: Open → Resolved/Cancelled
- Security: bcrypt password hashing, JWT auth with refresh tokens, CORS restricted

## Tech Stack
- Frontend: React, Vite (or CRA), TypeScript, Tailwind (optional)
- Backend: Node.js, Express, TypeScript (optional), JWT, bcrypt
- Database: PostgreSQL (via Prisma or Sequelize/Knex)
- Infra: Docker (optional), free-tier deployment targets

## Monorepo Layout
```
bloodmatch/
├─ client/           # React app
├─ server/           # Express API
├─ .env.example      # Sample environment variables
└─ README.md
```

## Getting Started

### Prerequisites
- Node.js (LTS) and npm
- PostgreSQL 14+
- Git

### 1) Clone and install
```bash
git clone https://github.com/shayma-dev/BloodMatch.git
cd BloodMatch
```

### 2) Environment variables
Copy `.env.example` to `.env` in both client and server as needed.

Server (.env):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/bloodmatch
JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
CORS_ORIGIN=http://localhost:5173
```

Client (.env):
```
VITE_API_URL=http://localhost:5000
```

### 3) Database setup (Prisma example)
```bash
cd server
npm i
npx prisma init
npx prisma migrate dev --name init
```

### 4) Run dev servers
```bash
# In one terminal
cd server && npm run dev

# In another terminal
cd client && npm run dev
```


## Data Model (overview)

Users
- id, role (DONOR | REQUESTER), name, email, phone, passwordHash

DonorProfile
- userId, bloodType, lastDonationDate, city, country, addressLine?, photoURL?

RequesterProfile
- userId, category (HOSPITAL | PATIENT), city, country, addressLine?

Request
- id, requesterId, bloodType, unitsNeeded, urgency, caseDescription, status, city, country, createdAt, updatedAt

Application
- id, requestId, donorId, status, createdAt

Eligibility rule
- Eligible if today − lastDonationDate ≥ 54 days

# bloodmatch-deploy
