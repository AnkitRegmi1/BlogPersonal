/**
 * Single source for the API base URL.
 * Set REACT_APP_API_URL in .env (e.g. to your deployed API) so admin and public use the same backend.
 */
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
