# Schoolhouse frontend

React and Tailwind frontend for the School Reporting API.

## Project structure

The frontend is organized by feature so each area can grow independently:

```text
src/
  app/             Application shell and page composition
  components/      Shared layout components
  features/
    auth/          Sign-in, school signup, and session state
    dashboard/     Overview page and summary data
    directory/     Student and staff directory UI and data
    students/      Student register, profiles, and status management
    subjects/      Subject catalogue and class-level curriculum links
    users/         Staff accounts, roles, status, and user data
  shared/          Shared navigation, role, and formatting utilities
  api.js           Shared API client
  styles.css       Global styles and dashboard theme
```

## Run locally

1. Start the backend at `http://localhost:4000` (see `../school-reporting-backend/README.md`).
2. Install dependencies and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite. Sign in with an active school administrator account.

The development server proxies `/api` requests to the backend. To use a different API URL, set `VITE_API_BASE_URL` in a local `.env` file.

The sidebar footer identifies the signed-in user and their school. Super administrators see the seeded `Legacy School` workspace by default; their overview includes school-level student and staff totals.
# schook-reporting-frontend
