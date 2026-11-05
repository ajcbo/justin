# Justin Clicker

A deliberately goofy clicker game starring Justin Tangarorang, with optional accounts and shared leaderboards.

[Play Justin Clicker](https://ajcbo.github.io/justin/)

GitHub Pages is the main game address. Accounts, ranked saves and shared leaderboards use the existing Railway server in the background. Guest saves remain in the GitHub browser origin. Existing account usernames, passwords and ranked progress are unchanged; sign in again from the GitHub address.

## Play

Click Justin to earn points and change his dance. Click quickly for a combo and an increasingly high voice. Unlock face versions and buy passive upgrades. Justin keeps dancing even without music. Apple Music remains an optional mode.

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
```

## Railway deployment

Connect this repository with root directory `/`; the root Dockerfile configures the build. In Railway's dashboard set the healthcheck to `/health` and keep one replica. Attach a persistent volume at `/data` before starting. `JUSTIN_DB=/data/game.sqlite` and `HOST=0.0.0.0` are set in the image. Generate a public Railway domain targeting port `8080`. Its `RAILWAY_PUBLIC_DOMAIN` sets the HTTPS origin automatically; for a custom domain set `PUBLIC_ORIGIN=https://your-domain` explicitly. Redeploy after attaching the volume and generating the domain. The server refuses Railway startup without persistent storage, or public startup without an HTTPS origin. The included `railway.toml` is legacy configuration; new Railway services require the dashboard settings instead.

The private SQLite database is never part of GitHub or the Docker build. Use one server replica with its volume. See [server documentation](server/README.md) for security, storage and game rules.

GitHub Pages serves the game files; its `justin-api-origin` meta tag points to Railway for shared accounts. The API permits only the configured game origins and uses HttpOnly, Secure, partitioned cookies for the GitHub session, plus per-session CSRF protection. Current browsers support these cookies even with ordinary third-party cookies blocked. Session tokens and passwords are never saved to JavaScript storage. Prop image sources are in [image credits](image-credits.html).
