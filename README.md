# Gym Planner

Frontend-only gym planner built with React and Vite for static hosting on GitHub Pages.

## What It Does

- lets you switch between preset workout splits
- shows a weekly training layout
- includes an exercise library with search and filtering
- tracks completed exercises
- stores planner data in local storage on the device
- works well on mobile browsers and can be added to the home screen

## Project Structure

- `apps/web`: the gym planner frontend
- `apps/api`: old backend code from the previous project, not needed for this app

## Run Locally

```bash
npm install
npm run dev --workspace web
```

## Build

```bash
npm run build --workspace web
```

The production output is generated in `apps/web/dist`.

## Deploy To GitHub Pages

A workflow is already included at `.github/workflows/deploy-web.yml`.

To use it:

1. Push this repo to GitHub
2. Make sure your default branch is `main`
3. In GitHub, open `Settings > Pages`
4. Set `Source` to `GitHub Actions`
5. Push to `main` or run the workflow manually

GitHub Pages will publish the contents of `apps/web/dist`.

## Mobile Use

After deployment:

1. Open the GitHub Pages URL on your phone
2. Use `Add to Home Screen` in Safari or Chrome
3. Open it like an app from your home screen
