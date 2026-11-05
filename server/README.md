# Justin accounts and leaderboards

The Node server provides optional accounts and shared rankings. GitHub Pages can host only the static guest game.

Run from the `headbop-lab` directory using Node.js 24 or later:

```sh
node server/server.mjs
```

Open `http://127.0.0.1:8765/`. On Windows, you can instead double-click `Start-Justin-Online.cmd` in the extracted preview folder, keep that window open, and visit that address. This server serves the website and its account/leaderboard API together. No package installation, paid API key, or third-party account provider is required to test locally.

## Player behavior

- Guests can play their existing local save and view the rankings.
- Username/password accounts are optional. Usernames are public, case-insensitively unique, and use 3–20 letters, numbers, or underscores. Passwords use 10–128 characters.
- Signing up starts a fresh ranked save. Browser balances are not imported into the rankings. Logging out restores the separate guest save.
- Leaderboards cover lifetime points, points per second, and a combined GOAT score. They refresh every five seconds while open and show the signed-in player's rank, including outside the top 100.
- GOAT score is `floor(100 * (4*log10(lifetime+1) + 3*log10(PPS+1) + 2*log10(clicks+1) + 2*extraFaces + log10(bestCombo+1)))`.
- No email is required. Password recovery is not implemented in this first version.
- This does not yet include live events or an admin panel.

## Server behavior

The server computes balances, purchases, passive rates and GOAT scores from game actions. It does not accept client-submitted balances. Clicks are limited to an average of 20 per second with a small burst allowance; timestamps are bounded and monotonic. The rate limit is a practical guard, not a guarantee against bots or all cheating.

Updates have idempotency keys so a network retry cannot grant the same clicks twice. Ranked progress pauses on connection failure and reconnects without overwriting the guest save. Active heartbeats earn full passive income. Gaps with no recent active heartbeat earn 25%, capped at 24 hours per settlement. The server uses its own stored update timestamps; client-submitted times and balances cannot claim offline rewards. Login/session restoration and returning play updates settle the reward once, update lifetime and GOAT rankings, and return the amount for the welcome receipt. Receipts are shown for absences of at least 30 seconds; shorter gaps still earn reduced income.

Each accepted click has a 1-in-1,500 cryptographically sampled chance to unlock Golden Justin once. The skin cannot be purchased. Retry receipts prevent rerolling or double-crediting. Achievements are computed from server-owned game progress and stored in the existing player state. Old version-1 saves preserve their points, upgrades and existing skins.

Passwords use scrypt with a random salt. Database sessions store a SHA-256 hash of a random session token and expire after seven days. Browser sessions use HttpOnly cookies. Direct Railway sessions use SameSite=Lax. The GitHub frontend uses a separate Secure, SameSite=None, Partitioned cookie, which current browsers isolate to the GitHub top-level site. State changes require an explicitly allowed Origin plus a per-session CSRF token. Session secrets remain in HttpOnly cookies and are never returned as JavaScript tokens. The API returns no password hashes or session tokens to the leaderboard. Authentication attempts and game updates are rate limited. SQLite statements use bound parameters.

## Persistence and hosting

Default data lives in `server/data/game.sqlite`. This private database, including its `-wal` and `-shm` files, must never be served as static files or committed to GitHub. Back it up using a consistent SQLite backup procedure and restrict filesystem access to the server process.

The main public game runs at `https://ajcbo.github.io/justin/`, with its static HTML meta tag `justin-api-origin` pointing to the Railway API. The frontend stays on GitHub and uses credentialed fetch calls. Railway also serves the same game directly. CORS allows exactly `https://ajcbo.github.io` by default, never all GitHub Pages owners or a wildcard. `FRONTEND_ORIGINS` can override this comma-separated allowlist. API preflights allow GET/POST, Content-Type and X-CSRF-Token only. The server still validates its own Host header.

For the HTTPS API server, set:

- `PUBLIC_ORIGIN=https://your-real-game-domain`
- `HOST=0.0.0.0`
- `PORT` to the host's assigned port (defaults to 8765)
- `JUSTIN_DB` to a path on persistent storage

On Railway, attach a persistent volume at `/data` and generate a public domain targeting port `8080`. The supplied image sets `JUSTIN_DB=/data/game.sqlite` and `HOST=0.0.0.0`. The generated `RAILWAY_PUBLIC_DOMAIN` supplies the HTTPS origin automatically. Startup refuses to run in Railway without a mounted persistent volume containing the database. The `/health` endpoint checks the database without exposing player data.

HTTPS enables Secure session cookies. Public binding without an HTTPS origin is rejected. The server does not accept arbitrary forwarded-host headers. Configure your proxy to preserve the expected Host header. On Railway only, rate limits use the edge-supplied `X-Real-IP` after validating it as an IP address. This assumes public HTTP edge ingress and a single trusted service; do not attach a TCP proxy or add untrusted services in the same environment. Other hosts use the socket address and ignore forwarding headers. See [Railway networking specifications](https://docs.railway.com/networking/public-networking/specs-and-limits). One persistent server process is the intended small friends-and-family deployment; a larger multi-instance game needs shared storage and coordinated rate limiting.

GitHub Pages cannot run the Node/SQLite server. Keep Railway running for account and leaderboard requests; the GitHub frontend alone provides guest play. An existing account can sign in on either host, with separate browser sessions and the same ranked save. Do not publish real credentials or the local test database.

## Tests

```sh
node test-clicker.cjs
node test-online.mjs
node test-railway.mjs
node test-cross-origin.mjs
node test-growth.mjs
```

The online tests launch an isolated server with an in-memory database. The Railway tests use a separate temporary database to verify account/session/progress persistence across a server restart and per-client login limits. They cover accounts, sessions, duplicate names, server-owned scores, rate limiting, retries, purchases, all three rankings, tied ranks, CSRF, and logout.

Implementation references: [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html).
