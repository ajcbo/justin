# Justin Clicker

A deliberately goofy clicker game starring Justin Tangarorang, with optional accounts and shared leaderboards.

[GitHub Pages guest game](https://ajcbo.github.io/justin/)

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
```

## Railway deployment

Connect this repository with root directory `/`; the root Dockerfile and `railway.toml` configure the build, one replica and `/health` checks. Attach a persistent volume at `/data` before starting. `JUSTIN_DB=/data/game.sqlite` and `HOST=0.0.0.0` are set in the image. Generate a public Railway domain targeting port `8080`. Its `RAILWAY_PUBLIC_DOMAIN` sets the HTTPS origin automatically; for a custom domain set `PUBLIC_ORIGIN=https://your-domain` explicitly. Redeploy after attaching the volume and generating the domain. The server refuses Railway startup without persistent storage, or public startup without an HTTPS origin.

The private SQLite database is never part of GitHub or the Docker build. Use one server replica with its volume. See [server documentation](server/README.md) for security, storage and game rules.

GitHub Pages runs the root static guest game only; shared accounts require the Railway server. Prop image sources are in [image credits](image-credits.html).
