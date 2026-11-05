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

Updates have idempotency keys so a network retry cannot grant the same clicks twice. Ranked progress pauses on connection failure and reconnects without overwriting the guest save. Passive gains require a recent active heartbeat and do not accrue during long offline gaps.

Passwords use scrypt with a random salt. Database sessions store a SHA-256 hash of a random session token and expire after seven days. Browser sessions use HttpOnly/SameSite cookies; state changes require a same-origin request plus a per-session CSRF token. The API returns no password hashes or session tokens to the leaderboard. Authentication attempts and game updates are rate limited. SQLite statements use bound parameters.

## Persistence and hosting

Default data lives in `server/data/game.sqlite`. This private database, including its `-wal` and `-shm` files, must never be served as static files or committed to GitHub. Back it up using a consistent SQLite backup procedure and restrict filesystem access to the server process.

For public hosting, run the entire site and API on the same HTTPS origin. Set:

- `PUBLIC_ORIGIN=https://your-real-game-domain`
- `HOST=0.0.0.0`
- `PORT` to the host's assigned port (defaults to 8765)
- `JUSTIN_DB` to a path on persistent storage

On Railway, attach a persistent volume at `/data` and generate a public domain targeting port `8080`. The supplied image sets `JUSTIN_DB=/data/game.sqlite` and `HOST=0.0.0.0`. The generated `RAILWAY_PUBLIC_DOMAIN` supplies the HTTPS origin automatically. Startup refuses to run in Railway without a mounted persistent volume containing the database. The `/health` endpoint checks the database without exposing player data.

HTTPS enables Secure session cookies. Public binding without an HTTPS origin is rejected. The server does not accept arbitrary forwarded-host headers. Configure your proxy to preserve the expected Host header. The initial rate limiter uses the socket address; account for shared proxy addresses when choosing a production host. One persistent server process is the intended small friends-and-family deployment; a larger multi-instance game needs shared storage and coordinated rate limiting.

GitHub Pages cannot run this Node/SQLite server. Uploading just the static files will preserve guest play, but will not create working online accounts. Do not publish real credentials or the local test database.

## Tests

```sh
node test-clicker.cjs
node test-online.mjs
```

The online tests launch an isolated server with an in-memory database. They cover accounts, sessions, duplicate names, server-owned scores, rate limiting, retries, purchases, all three rankings, tied ranks, CSRF, and logout.

Implementation references: [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html).
