# spa-manager-fe

Frontend base for the spa management system.

## Chosen stack
- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- TailwindCSS v4

## Why this stack
This is the most suitable stack for the current backend state because it is:
- fast to scaffold and iterate
- strongly typed
- good for form-heavy business systems
- easy to map against evolving backend APIs
- clean for role-based portals and dashboard flows

## Current frontend base
- login page wired to backend `/auth/login`
- auth bootstrap using `/auth/me`
- protected routes
- app shell / dashboard
- customer list page mapped to `/customers`
- scheduling playground mapped to:
  - `/scheduling/slots/query`
  - `/scheduling/slots/lock`

## Local run
```bash
cp .env.example .env
npm install
npm run dev
```

## Important notes
- The frontend assumes the backend/dev seed is already available.
- Default credentials from backend seed:
  - username: `owner1`
  - password: `password`
- This repo is currently focused on mapping the backend features already implemented before expanding broader UI flows.
