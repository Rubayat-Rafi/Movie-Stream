# Project Overview: `stream-movies`

`stream-movies` is a **fully responsive, frontend-only movie & TV discovery web application** powered by **The Movie Database (TMDB) API v3**. The application has no custom backend or database—it fetches live data directly from TMDB endpoints, caches responses on the client, and presents a modern, responsive browsing experience.

---

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| **Framework** | React 19 (`react`, `react-dom`) | JavaScript / JSX |
| **Build Tool** | Vite (`vite`, `@vitejs/plugin-react`) | Fast HMR & bundling |
| **Routing** | React Router (`react-router-dom`) | Uses `BrowserRouter` (install if not yet added) |
| **Styling** | Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) | Mobile-first responsive utility classes |
| **Data Fetching** | TanStack Query (`@tanstack/react-query` v5) | Server state, caching, pagination, loading/error states |
| **Icons** | Lucide React (`lucide-react`) | Consistent UI iconography |
| **Linting** | Oxlint (`oxlint`) | Run via `npm run lint` |
| **API** | TMDB API v3 (`https://api.themoviedb.org/3`) | Read-only REST API with Bearer token auth |

---

## Project Structure

Organize `src/` cleanly by responsibility:

```text
src/
├── api/              # TMDB HTTP client, endpoint functions, and image URL helpers
├── components/       # Reusable UI components (Navbar, Footer, MovieCard, HeroBanner, etc.)
│   └── ui/           # Generic primitives (Skeleton, Badge, Button, Modal, ErrorState)
├── hooks/            # Custom TanStack Query hooks (useTrending, useMovieDetails, useSearch, etc.)
├── pages/            # Route-level page components (HomePage, MoviesPage, MovieDetailPage, SearchPage, NotFoundPage)
├── router/           # AppRouter using BrowserRouter, Routes, and Route definitions
├── utils/            # Formatting helpers (runtime, dates, ratings, genres)
├── index.css         # Tailwind CSS v4 entry (@import "tailwindcss";) & custom theme tokens
└── main.jsx          # App root with QueryClientProvider and AppRouter
```

---

## TMDB API Integration Rules

- **Base URL:** `https://api.themoviedb.org/3`
- **OpenAPI / Docs Reference:** `https://developer.themoviedb.org/llms.txt`
- **Authentication:** Use the **API Read Access Token** via HTTP `Authorization: Bearer <token>` header on every request, alongside `accept: application/json`.
- **Environment Variables:** Store credentials in `.env` (never commit `.env` to git):
  ```env
  VITE_TMDB_READ_ACCESS_TOKEN=your_tmdb_v3_bearer_token_here
  ```
- **Image CDN:** Build image URLs from TMDB configuration base URL:
  - Base: `https://image.tmdb.org/t/p/`
  - Posters: `w342`, `w500`, `w780`
  - Backdrops: `w780`, `w1280`, `original`
  - Profiles: `w185`, `h632`
  - Always handle `null` `poster_path` / `backdrop_path` with a clean fallback UI.
- **Rate Limiting & Caching:**
  - Respect TMDB rate limits by configuring sensible TanStack Query `staleTime` (e.g., 5–10 minutes for lists/details, longer for static configuration/genres).
  - Debounce search inputs before triggering search queries.
- **Core Endpoints to Support:**
  - `/configuration` — static config & image sizes
  - `/trending/movie/{time_window}` — trending movies (`day` / `week`)
  - `/movie/popular`, `/movie/top_rated`, `/movie/upcoming`, `/movie/now_playing`
  - `/movie/{movie_id}` (with `append_to_response=credits,videos,similar,recommendations`)
  - `/genre/movie/list` & `/discover/movie` — genre filtering & sorting
  - `/search/movie` & `/search/multi` — keyword search

---

## Coding & UI Guidelines

1. **Pure API-Driven Architecture:** Do not add mock databases, auth backends, or persistent server state. All content comes from TMDB API calls via TanStack Query.
2. **Fully Responsive Design:**
   - Design mobile-first (`default` -> `sm` -> `md` -> `lg` -> `xl` -> `2xl`).
   - Use responsive grids for movie cards (e.g., 2 columns on mobile, 3–4 on tablet, 5–6 on desktop) and collapsible navigation on smaller screens.
3. **Loading & Error States:**
   - Every TanStack Query view must handle `isLoading`/`isPending` (skeleton loaders), `isError` (user-friendly retry button), and empty results gracefully.
4. **Routing (`BrowserRouter`):**
   - Define all routes centrally in `src/router/`.
   - Include a fallback `*` route for 404 Not Found pages.
5. **Code Quality:**
   - Keep components small, focused, and reusable.
   - Keep API fetch functions separate from React components; wrap them in custom hooks in `src/hooks/`.
   - Run `npm run lint` and `npm run build` to verify changes.
