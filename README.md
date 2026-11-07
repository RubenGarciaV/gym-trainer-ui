# Gym Trainer UI

React, Vite, Tailwind CSS, and Recharts frontend for Gym Trainer.

The app's Home dashboard charts body-weight entries and completed workout
durations. Workouts lists the user's training routines and starts guided
sessions with per-set checkboxes and rest timers. Completed sessions are saved
to History with their start and completion times. Training creates routines
from the exercise catalog, and Profile updates the account name and password
and records body measurements.
Email is displayed in Profile but cannot be changed because the API does not
currently enable email changes.

## Local development

1. Install the dependencies with `npm install`.
2. Set `VITE_API_URL` in `.env.local` to the Gym Trainer API origin. For local
   development, use `http://localhost:3001`.
3. To test without running the API, add `VITE_API_MOCKING=enabled` to
   `.env.local`. The mock account is `demo@gymtrainer.local` /
   `password123`. MSW saves the mock session in local browser storage so it
   survives a page refresh. Mock credentials are for development only; clear
   the site's local storage to sign out. Mock routines, workouts, and weight
   entries are held in memory and reset on reload.
4. Start the frontend with `npm run dev`. Restart Vite after changing
   `.env.local`.

The login and registration forms use the API's Better Auth email endpoints and
send requests with `credentials: 'include'` so the session cookie is retained.
Without MSW enabled, start the API separately and allow the frontend origin in
its `CORS_ORIGINS`. MSW also mocks the exercise catalog, dashboard data,
workout history, routine creation, session profile, and profile updates. Mock
workout, routine, and weight data are in memory. The persisted mock session
contains development-only credentials in local browser storage. MSW is only
enabled in Vite development mode.

## Deploy to Vercel

Import this repository in Vercel with the Vite framework preset and set
`VITE_API_URL` to the deployed API origin for Production and Preview. Frontend
requests in those environments use the `/api` Vercel rewrite to proxy requests
through the UI's own domain. This keeps the session cookie first-party on
mobile browsers that block third-party cookies. Set the deployed UI origin in
the API's `CORS_ORIGINS` environment variable. The `vercel.json` rewrite also
supports direct navigation and refreshes on React Router routes.

Deploy from the Vercel CLI with `vercel --prod`.
