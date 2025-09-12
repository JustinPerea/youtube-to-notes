# Changelog

All notable changes to this project will be documented in this file.

## 2025-09-12

### Security/CORS
- Removed global CORS headers from `next.config.js` to avoid overexposure and conflicts with per-route logic.
- Centralized CORS handling in `middleware.ts` for API routes only.
- Implemented strict origin allow‑list using hostname parsing:
  - Allows `kyotoscribe.com`, `www.kyotoscribe.com`, `localhost`, `127.0.0.1`, and any `*.vercel.app` preview domains.
- Added `Vary: Origin` and preserved correct OPTIONS preflight handling.

Files touched:
- `next.config.js`
- `middleware.ts`

### Secrets/Gemini
- Removed `GOOGLE_GEMINI_API_KEY` from `next.config.js` `env` to prevent bundling into the client.
- Added lazy initialization for the Gemini client so missing keys do not crash on import; clear error surfaces on first use if unset.

Files touched:
- `next.config.js`
- `lib/gemini/client.ts`

### Domain Detection
- Consolidated domain detection via `detectTutorialDomain` so both API routes and the Gemini client share one implementation.
- Re-exported utilities from `lib/templates.ts` so imports from `@/lib/templates` expose `detectTutorialDomain`.
- Fixed runtime error where `detectTutorialDomain` was undefined due to module resolution between `lib/templates.ts` and `lib/templates/index.ts`.

Files touched:
- `lib/gemini/client.ts`
- `app/api/videos/process/route.ts`
- `lib/templates.ts` (re-exports)

### Verification Checklist
- Local dev server on port 3003: video processing flows succeed.
- Same-origin API requests succeed; external origins receive no CORS approval.
- Vercel preview deployments (`*.vercel.app`) can call APIs.
- No client code references `process.env.GOOGLE_GEMINI_API_KEY`.

### Notes
- Next candidates: fix AES‑GCM crypto (`createCipheriv/createDecipheriv`), protect debug endpoints in production, and consider shared storage for rate limiting in production.

### Crypto Hardening
- Replaced deprecated and incorrect crypto usage with AES‑256‑GCM using `createCipheriv`/`createDecipheriv`.
- Properly generate and store a 96‑bit IV and auth tag alongside ciphertext (`iv:authTag:ciphertext`).
- Derive a 32‑byte key from `API_ENCRYPTION_KEY`:
  - If it’s a 64‑hex string, use it directly as the raw key.
  - Otherwise derive via `scryptSync(secret, 'api-key-security', 32)`.
- This fixes decryption integrity and aligns with modern Node crypto guidance.

Files touched:
- `lib/security/api-key-security.ts`

### Crypto Test Helper
- Added a local validation script to verify AES‑256‑GCM encrypt/decrypt roundtrips, wrong‑key failure, and export/import integrity.
- Run with `npm run test:crypto` (uses `API_ENCRYPTION_KEY` if set, otherwise a local default).

Files touched:
- `scripts/test-encryption.ts`
- `package.json` (added `test:crypto`)

### Debug Endpoints Gating
- Added environment-based gate for all `/api/debug/*` routes in middleware.
- In production/preview, debug endpoints return 404 unless `DEBUG_ENDPOINTS_ENABLED=true`.
- Development environment remains fully open for debug endpoints.

Files touched:
- `middleware.ts`

### Environment Docs
- Documented `YOUTUBE_DATA_API_KEY` and `DEBUG_ENDPOINTS_ENABLED` in `.env.example` and README.

Files touched:
- `env.example`
- `README.md`
