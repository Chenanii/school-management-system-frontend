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
    academic-years/ Academic-year calendar management and term summaries
    terms/          Term calendar, lifecycle, and status workflow
    teaching-assignments/ Teacher, class group, standalone or curriculum subject, and term allocations
    assessments/    Assessment lifecycle, mark entry, and results review
    term-results/   Calculated term subject results and finalize/publish workflow
    report-cards/   Student report-card previews and printing for published term results
    promotions/     Result-based promotion policy, decisions, and batch history
    subscriptions/  School billing self-service and platform plan/subscription management
    directory/     Student and staff directory UI and data
    students/      Student register, profiles, and status management
    enrollments/   Student term placements, status management, and bulk progression
    enrollments/   Student term placements, status management, and bulk progression
    subjects/      Subject catalogue and class-level curriculum links
    class-levels/  Class levels, progression order, groups, and curriculum overview
    class-groups/  Class groups within levels, with enrolment and assignment counts
    teachers/      Teacher directory, invitation management, and invitation acceptance
    class-subjects/ Curriculum links between class levels and subjects
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

The sidebar footer identifies the signed-in user and their school. Super administrators select a school workspace from the sidebar; school-specific requests use that selected context.
# schook-reporting-frontend
