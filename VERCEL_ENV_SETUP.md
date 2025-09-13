# Vercel Environment Setup (v0.2.0)

This release adds stricter CSP/CORS, gates debug endpoints, and gates AdSense by config. Set these variables in Vercel → Project → Settings → Environment Variables.

## Required

- GOOGLE_GEMINI_API_KEY: your Gemini API key
- YOUTUBE_DATA_API_KEY: your YouTube Data API v3 key

## Recommended

- API_ENCRYPTION_KEY: 64‑hex key for AES‑256‑GCM encryption
  - Generate: `openssl rand -hex 32`
  - Scope: Server only (Production and Preview)

## AdSense (Optional — enable only when ready)

- NEXT_PUBLIC_ADSENSE_ENABLED: `true` or `false`
- NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: your numeric publisher id (no `ca-pub-` prefix)

When both are set (and true), layout injects AdSense meta/script with a CSP nonce and loads the client component via dynamic import.

## Debug Endpoints Gate

- DEBUG_ENDPOINTS_ENABLED: `false` (default). Set `true` only if you intentionally need `/api/debug/*` in Preview/Production.

## Supabase / NextAuth (if used by your deployment)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXTAUTH_SECRET
- NEXTAUTH_URL

## Notes

- NODE_ENV and VERCEL_ENV: Vercel sets these automatically (no need to define).
- After changing env vars, trigger a redeploy to apply them.
- CSP will include a per‑request nonce; preview/prod exclude `'unsafe-inline'` and `'unsafe-eval'`.

