# PropertyOS AI — Cinematic Website

A responsive cinematic marketing website for PropertyOS AI, a Kenya-first property-management platform in development.

## Experience
- Architectural hero scene built with CSS (no WebGL dependency).
- Editorial product story, dashboard concept preview, feature overview and workflow.
- Pilot enquiry form with server-side validation, Cloudflare Turnstile verification, explicit consent, and private database storage (requires deployment secrets before it accepts enquiries).
- FAQ accordion and responsive navigation.
- Reduced-motion support and semantic HTML.

## Stack
- Next.js 15
- React 19
- TypeScript
- CSS

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Production readiness
1. Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production and Preview; keep the service-role key server-only. Then test a real enquiry and verify it appears in `public.pilot_leads`.
2. Add a real privacy notice, terms and company contact details.
3. Replace sample dashboard values with verified product data only when the product backend is ready. Current values are illustrative.
4. Confirm feature availability before publishing. Tenant portal, M-Pesa, automated reminders and AI insights are planned, not represented as live.
5. Verify the legal company name after BRS registration. The website describes PropertyOS AI Limited as a proposed company name pending registration.
6. Add analytics only with appropriate privacy and consent configuration.
7. Run accessibility, mobile, browser and production build checks before deployment.

## Brand
**PropertyOS AI**  
**Every Property. Under Control.**  
Nairobi, Kenya.


## Installable website (PWA)
- The public marketing site can be installed from supported browsers using the Install app action or browser menu.
- The service worker caches only the public home page and public static assets for a basic offline fallback.
- API, login, dashboard, account and other user-specific routes are excluded from service-worker caching.
- This is an installable web app, not a native Android APK or iOS App Store application.

## Security and performance baseline
- Global HSTS, CSP, frame, MIME-sniffing, referrer and permissions headers are configured in `next.config.ts`.
- Next.js response compression is enabled; static assets use browser cache-first behavior via the service worker.
- Never put Supabase service-role keys, OpenAI keys, M-Pesa credentials or encryption keys in client-side code.
- Supabase database/storage encryption at rest and TLS are platform-level controls; verify the current project configuration and use RLS for tenant/property-level authorization before storing live customer data.
- The CSP is a baseline and must be tested against every production integration before tightening further.
- Run `npm run build` and browser checks after each security-header or PWA change.


## Pilot enquiry capture
- The homepage form posts to `/api/pilot-interest`.
- Cloudflare Turnstile is required and verified server-side, with the hostname checked against the request origin.
- The database table `public.pilot_leads` stores the normalized email, consent timestamp/version, source and creation timestamp only.
- RLS is enabled and direct `anon` / `authenticated` table privileges are revoked. The API uses a server-only Supabase service key after challenge verification.
- Until all three Vercel environment variables are configured, the page deliberately shows that pilot registration is opening soon and does not collect personal data.
- Never add the Supabase service-role/secret key to a `NEXT_PUBLIC_*` variable or client component.
