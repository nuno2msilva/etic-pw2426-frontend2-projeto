// config.ts — Centralised runtime configuration. Single source of truth for environment-dependent values. Import API_BASE from here instead of repeating process.env everywhere.

/** Base URL for backend API requests. Empty in dev (Next.js proxy), full URL if set. */
export const API_BASE: string = process.env.NEXT_PUBLIC_API_URL || "";
