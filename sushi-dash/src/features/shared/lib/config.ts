// config.ts — Centralised runtime configuration. Single source of truth for environment-dependent values. Import API_BASE from here instead of repeating process.env everywhere.

/** Base URL for backend API requests. Empty in dev (Next.js proxy), full URL if set. */
export const API_BASE: string = process.env.NEXT_PUBLIC_API_URL || "";

/** Toggle CRT/VCR visual effect globally. Set to false to disable it. */
export const ENABLE_CRT_EFFECT: boolean = false;

/**
 * Web-vitals reporter adds extra client work and network activity.
 * Keep disabled by default and enable explicitly when telemetry is needed.
 */
export const ENABLE_WEB_VITALS_REPORTER: boolean =
	process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true";
