# Justin Clicker

A deliberately goofy clicker game starring Justin Tangarorang, with optional accounts and shared leaderboards.

[Play Justin Clicker](https://ajcbo.github.io/justin/)

GitHub Pages is the main game address. Accounts, ranked saves and shared leaderboards use the existing Railway server in the background. Guest saves remain in the GitHub browser origin. Existing account usernames, passwords and ranked progress are unchanged; sign in again from the GitHub address.

## Play

Click Justin to earn points and change his dance. The voice stays normal for the first 10 hits and gradually reaches its two-octave ceiling at 210 hits. Collect 18 Justins, including Miles Morales, a screaming Hamster Justin using his own face/skin colour, eight supplied photo variants and a rare Golden Justin. Golden Justin drops at 1 in 1,500 accepted clicks and cannot be bought; its +250 click boost is permanent. The earlier 24-karat skin remains a normal purchase.

Earn passive income at full speed while active and 25% while away, capped at 24 hours per return. The displayed daily offline estimate is PPS × 21,600. Ranked offline time and rare rolls are calculated by the server. Offline receipts appear after absences of at least 30 seconds; smaller gaps still accrue the reduced income. Sixteen permanent achievements track clicks, combos, income, collection and lucky discoveries.

Click effects include comic bonks, confetti, rubber panic and afterimages, plus launch/photocopier toys. Reduced-motion settings suppress extra effects. Justin keeps dancing without music. Apple Music remains an optional mode.

On iPhone/iPad, an animated image layer backs up the canvas face; it is also available as “simple face display (iPhone fix)” in Settings. Character colour treatments are prepared in small sprites instead of depending on canvas filters. Prop processing and canvas resolution are bounded to reduce mobile memory use.

Guests keep playing their separate browser save. Signing up creates a fresh ranked save with lifetime points, points per second and GOAT rankings. Password recovery, admin events and an admin panel are not included yet.

## Online server

Node.js 24 or later; no package installation required:

```sh
node server/server.mjs
```

Open `http://127.0.0.1:8765/`. The server serves `dist/` and the account API together. Tests:

```sh
node test-clicker.cjs
node test-online.mjs
node test-railway.mjs
node test-cross-origin.mjs
node test-growth.mjs
```

## Railway deployment

Connect this repository with root directory `/`; the root Dockerfile configures the build. In Railway's dashboard set the healthcheck to `/health` and keep one replica. Attach a persistent volume at `/data` before starting. `JUSTIN_DB=/data/game.sqlite` and `HOST=0.0.0.0` are set in the image. Generate a public Railway domain targeting port `8080`. Its `RAILWAY_PUBLIC_DOMAIN` sets the HTTPS origin automatically; for a custom domain set `PUBLIC_ORIGIN=https://your-domain` explicitly. Redeploy after attaching the volume and generating the domain. The server refuses Railway startup without persistent storage, or public startup without an HTTPS origin. The included `railway.toml` is legacy configuration; new Railway services require the dashboard settings instead.

The private SQLite database is never part of GitHub or the Docker build. Use one server replica with its volume. See [server documentation](server/README.md) for security, storage and game rules.

GitHub Pages serves the game files; its `justin-api-origin` meta tag points to Railway for shared accounts. The API permits only the configured game origins and uses HttpOnly, Secure, partitioned cookies for the GitHub session, plus per-session CSRF protection. Current browsers support these cookies even with ordinary third-party cookies blocked. Session tokens and passwords are never saved to JavaScript storage. Prop image sources are in [image credits](image-credits.html).
