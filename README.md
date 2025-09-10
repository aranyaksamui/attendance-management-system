# AttendTrack

A full-stack attendance management system built with Express + Vite + React + Drizzle ORM.

## Tech Stack
- Express (API + server)
- Vite + React (client)
- Drizzle ORM
- SQLite (dev) / Postgres (prod, e.g., Neon)

## Prerequisites
- Node.js 20+
- npm 10+

## Environment Variables
Create a `.env` file in the project root with the following variables:

```
# Base
NODE_ENV=development
PORT=5000

# Production database (Postgres/Neon)
# Example: postgres://<user>:<password>@<host>:5432/<db>
DATABASE_URL=
```

Notes:
- In development, the app uses local SQLite (`dev.db`) automatically.
- In production, `DATABASE_URL` is required (Postgres/Neon).

## Install & Run (Development)
```
npm ci
npm run dev
```

## Build (Production)
```
npm run build
npm start
```
This builds the client to `dist/public` and runs the bundled server from `dist`.

## Database
- Dev: SQLite `dev.db`
- Prod: Postgres via `DATABASE_URL`

Push schema to production Postgres (Drizzle):
```
npm run db:push
```

Seed demo data (production or dev):
- POST `/api/seed` on the running server to insert batches/semesters/subjects, etc.

## Deployment
### Render (Blueprint)
- Repo includes `render.yaml` for one-click setup:
  - Web service builds with `npm ci && npm run build` and starts with `npm start`.
  - Provisioned Postgres database; `DATABASE_URL` is injected automatically.

### Docker
```
docker build -t attendtrack .
docker run -p 5000:5000 -e NODE_ENV=production -e PORT=5000 -e DATABASE_URL="<conn>" attendtrack
```

## License
MIT
