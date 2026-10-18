# Orbit — IP & Approximate Location Dashboard

A static GitHub Pages frontend and a Vercel Serverless Function. It shows the visitor's public IP as reported by the hosting proxy and approximate network geolocation when available. It does not use GPS, create visitor profiles, or save location history.

## Project layout

```text
ip-location-dashboard/
├── backend/
│   ├── api/geo.js
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── config.js
└── README.md
```

## Run locally

Requirements: Node.js 18+ and the Vercel CLI (`npm install -g vercel`).

1. From the `backend` directory, run `vercel dev`.
2. The API is typically available at `http://localhost:3000/api/geo`.
3. Set `frontend/config.js` `API_URL` to `http://localhost:3000/api/geo` for local testing.
4. Serve the frontend over HTTP, for example `cd frontend && python -m http.server 8080`, then visit `http://localhost:8080`.
5. For local cross-origin testing, configure `ALLOWED_ORIGINS=http://localhost:8080` in the Vercel development environment. The external fallback may not identify the original visitor IP in every local setup.

## Deploy backend to Vercel

1. Import this repository into Vercel.
2. Set the Vercel project root directory to `backend` (or move the backend files to your chosen project root).
3. Deploy and note the URL, such as `https://your-project.vercel.app`.
4. In Vercel Project Settings → Environment Variables, set:
   - `ALLOWED_ORIGINS` to the exact frontend origin, e.g. `https://YOUR-USERNAME.github.io`. The repository path is not part of the origin. Add a custom domain origin if you use one. Multiple origins can be comma-separated.
   - `GEO_FALLBACK=true` to allow fallback lookups, or `false` to disable them.
5. Redeploy after setting environment variables.
6. Test `https://your-project.vercel.app/api/geo`.

## Deploy frontend to GitHub Pages

1. Publish the contents of `frontend/` in a GitHub repository (repository root or a Pages branch/folder).
2. Edit `frontend/config.js` and set `API_URL` to `https://your-project.vercel.app/api/geo`.
3. In GitHub repository Settings → Pages, select the branch and folder to publish.
4. Once published, open the Pages URL and click **Detect my connection**.
5. If the browser reports a CORS error, check that the exact page origin is in Vercel's `ALLOWED_ORIGINS` value, then redeploy the backend.

## Fields and limitations

- `ip`: first address in `x-forwarded-for` as seen by the Vercel deployment, falling back to `x-real-ip`. Forwarded headers should only be trusted when set by your hosting proxy.
- `city`, `region`, `country`, `latitude`, `longitude`, `timezone`: Vercel geo headers or the optional fallback provider.
- `isp`: may be available from the fallback provider; Vercel geo headers do not reliably provide ISP.
- `latency`: browser-measured elapsed time for the API request, not ICMP ping latency.
- The 3D globe uses Globe.gl and public CDN Earth textures, so those resources require an internet connection.

## Privacy and security

This is designed as a user-initiated “show my connection” tool: the frontend sends a request only after the visitor clicks a button. The fallback sends the queried IP to ipwho.is. Set `GEO_FALLBACK=false` to disable external lookup. The app itself does not write to a database or local storage, but hosting providers may maintain infrastructure logs under their own policies. Avoid logging or exposing raw IP addresses, keep CORS origins restricted to sites you control, and do not use this for covert monitoring or building location histories. CORS is not authentication; it only controls which browser origins may read responses.
