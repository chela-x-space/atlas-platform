# ATLAS Web

Public MVP web application built with Next.js 16 and Node.js.

## Deployment

1. Install dependencies: `npm ci`
2. Copy `.env.example` to `.env.local` and configure only integrations whose usage terms apply to the deployment. USGS and NOAA/NHC require no credentials. Open-Meteo remains disabled unless `OPEN_METEO_API_KEY` is set or eligible non-commercial use is explicitly confirmed with `OPEN_METEO_ALLOW_NONCOMMERCIAL=true`.
3. Start development: `npm run dev`
4. Build production: `npm run build`
5. Start production: `npm start`

Run `npm run typecheck`, `npm run lint`, and `npm test` before deployment. The production host must permit outbound HTTPS requests to USGS and NOAA/NHC. Provider failures return partial or unavailable states rather than fabricated data. A single Node.js instance uses an in-memory event cache; horizontally scaled deployments should expect each instance to refresh independently.
