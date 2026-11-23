/**
 * src/config/api.ts
 * Production-ready API Base URL resolution for Mindora 2.0.
 * 
 * In production cloud deployment (e.g. Vercel -> Render), the frontend receives
 * VITE_API_URL from the build environment (e.g. 'https://mindora-api.onrender.com').
 * In local development, it defaults safely to 'http://127.0.0.1:8000'.
 */

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000';
  }
  return '';
}
