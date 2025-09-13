# BloodMatch — Client (Web App)

React frontend for BloodMatch. Donors and Requesters can sign up, manage profiles, create/find requests, and coordinate donations. Matching is based on blood type and location; donor eligibility enforces a 54‑day cooldown.

## Tech

- React + Vite
- TypeScript (optional)
- UI: Tailwind CSS (optional)
- API base: `VITE_API_URL`

## Requirements

- Node.js LTS
- npm or pnpm
- server API running (or staging URL)
- .env file (see below)

## Environment Variables

Copy `.env.example` to `.env` and set your backend API URL:

```
cp .env.example .env
```

Edit `.env` if your backend is not running on localhost:5000.

## Install & Run

```bash
cd client
npm install
npm run dev
```

The Vite dev server defaults to http://localhost:5173.

## Project Structure

- `src/api/axios.js`: Axios instance for all API calls
- `src/pages/`: Main pages (Landing, Auth, Profile)
- `src/App.jsx`: App routes

## .gitignore

Your `.gitignore` should include:

```
node_modules
dist
.env
```

## App Structure

- pages:
  - Landing: choose “I need blood” or “I can donate”
  - Auth: Login, Signup
  - Donor:
    - Profile: edit blood type, last donation date, location, photo (optional)
    - Matching Requests: list + details; Apply (disabled if ineligible)
    - My Applications: list applied requests
  - Requester:
    - Profile: category (Hospital/Patient), contact, location
    - Create Request: minimal fields, location defaults from profile
    - My Requests: list, status, details, applicants, Mark Resolved/Cancel

## API Integration

- Auth: /auth/signup, /auth/login, /auth/refresh
- Profiles: GET/PUT /me/profile
- Requests:
  - Donor: GET /requests?bloodType=&city=&country=
  - Requester: POST /requests, PATCH /requests/:id/status, GET /my/requests
- Applications:
  - Donor: POST /requests/:id/apply, GET /my/applications
  - Requester: GET /requests/:id/applicants

## UI States & Validation

- Form validation on required fields
- Clear error messages from API responses
- Loading/skeleton states for lists and details
- Empty states for no matches / no applicants
- Character limit for case description (≤ 300)

## Accessibility & UX

- Keyboard navigable forms and buttons
- Semantic headings and labels
- High-contrast text and focus outlines
- Clear status indicators: Open, Resolved, Cancelled, Ineligible
