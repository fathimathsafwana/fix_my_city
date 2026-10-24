export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://fix-my-city-seven.vercel.app"
    : "http://localhost:5000");

export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL ||
  import.meta.env.VITE_SITE_URL ||
  (import.meta.env.PROD
    ? "https://fix-my-city-bs3z.vercel.app"
    : "http://localhost:5173");
