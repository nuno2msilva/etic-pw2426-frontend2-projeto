/**
 * config.ts — Centralised runtime configuration
 *
 * Single source of truth for environment-dependent values.
 * Import API_BASE from here instead of repeating import.meta.env everywhere.
 */

/** Base URL for backend API requests. Empty in dev (Vite proxy), full URL if set. */
export const API_BASE: string =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "";
