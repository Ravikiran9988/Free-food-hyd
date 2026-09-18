# Frontend Documentation

The Free Food Hyderabad frontend is a modern, responsive single-page application (SPA) built with React and TypeScript.

## Framework & Tooling
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **Maps**: React-Leaflet (Leaflet wrapper for React)

## Application Structure (`apps/frontend/src/`)
- `components/`: Reusable UI elements (`SpotCard`, `MapComponent`, `Navigation`).
- `pages/`: Route-level components (`Home`, `NearMe`, `AdminDashboard`).
- `services/`: API integration and data fetching (`api.ts`).

## Features
- **Map View**: Uses clustering (`leaflet.markercluster`) to render thousands of Annadhanam spots efficiently.
- **Search & Filter**: Clientside handling of location queries, interfacing with the backend `/spots` and `/spots/nearby` endpoints.
- **Dynamic Views**:
  - *Today*: Fetches `/events/today-sections` to split items into "Serving Now", "Starting Soon", and "Later Today".
  - *Upcoming*: Groups future events intelligently.
- **Community UI**: Forms allowing users to "Add a Place", "Report", or "Suggest Update". 
- **Admin UI**: Built-in `AdminDashboard.tsx` that handles JWT-based authentication to moderate community submissions.

## Progressive Web App (PWA)
The application includes a `manifest.json` in the `public/` directory, allowing it to be installed on mobile devices. Theme color is set to `#f97316` (Brand Orange). SEO meta tags and Open Graph definitions reside in `index.html`.
