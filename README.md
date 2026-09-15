# FitSphere — Professional Fitness & Habit Tracker

## Pages
- `dashboard.html` — today's overview, quote API, Pomodoro, daily score and weekly snapshot.
- `tasks.html` — create/edit/delete tasks, priorities, drag & drop, pending/completed board and Pomodoro counts.
- `habits.html` — recurring habits, categories, daily completion and 12-week activity heatmap.
- `water.html` — 250/500/750 ml quick-add buttons, custom amount, daily log and weekly hydration chart.
- `fitness.html` — calories, steps, sleep logging, workouts and weekly sleep graph.
- `progress.html` — combined weekly statistics, bar charts, category completion and saved quote CRUD.

## Persistence
Everything important is stored in browser `localStorage`, so the pages share the same data automatically.

## Quote API
Dashboard attempts to retrieve a fresh quote from `https://dummyjson.com/quotes/random`. A local fallback list is used if the request is unavailable.

## Run
Open `dashboard.html` in a browser. For the quote API, a local server is recommended:
- VS Code: install/use Live Server, then open `dashboard.html`.
- Or use any simple static HTTP server.

No framework or chart library is required.
