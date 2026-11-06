# Justin Clicker

Main address: https://ajcbo.github.io/justin/

## Earnings

Justins add permanent click power. Owning multiple Justins adds their bonuses, independent of the worn face. Upgrade quantities never multiply. Gold, Golden, Platinum, Diamond and Rainbow cannot be purchased. Gold comes from boxes/daily gifts, Golden from 5,000-click rolls, and gem variants from rolls and gift guarantees.

Players below 2 million lifetime earnings receive 2× click and active passive income. The bonus only applies to the portion of earnings before that threshold. Offline income, wallet gifts and scaled reward payouts keep their existing rules. Spending and rebirth cannot re-enable catch-up, and permanent PPS/GOAT calculations exclude this temporary assistance.

Rebirths supply the permanent earnings multiplier: 1 + 0.5 per rebirth. First requirement: 1 million points earned in the run; each next requirement is five times higher. Thirteen milestones are supported. Rebirth resets wallet, gear levels, purchased Justins and run earnings. Roll-only Justins, backdrops, lifetime stats, achievements, claim history and roll history remain. It requires eligibility and an explicit confirmation; replayed requests cannot reset twice. Admin wallet gifts do not count as run earnings.

Rewards scale from permanent click power (two clicks/sec reference) plus passive income. Timed admin multipliers and catch-up do not inflate rewards. Daily gifts use 60 seconds of this rate, challenges 250/400/350 seconds, free milestone rolls 60 seconds, and catches 15 seconds. Box point refunds scale to ten seconds, capped at half the 150,000-point price to prevent profitable refund loops. Rewards are calculated before granting the rolled character. Daily gift receipts are separate from challenge receipts.

## Rolls and activities

Daily: Rainbow 2%, Diamond 8%, Platinum 20%, Gold 10%, points 60%. Guarantee milestones for Platinum/Diamond/Rainbow: gift 7/30/90. Five visits in a seven-day track earn a bonus; missing days does not erase lifetime progress.

Mystery boxes: 150,000 points, three per day. Rainbow 0.5%, Diamond 2%, Platinum 8%, Gold 4.5%, points 85%. Daily gifts keep their previous odds. Free 5,000 full-value click rolls: Golden 20%, Diamond 15%, Platinum 35%, points 30%. Duplicates give points. Server-saved results are queued behind an Open earned rolls button; they never open a dialog automatically. A purchased box only starts its reveal after the player's explicit purchase. The server checks the displayed price against its current price, so stale tabs cannot charge a newly increased price without a refresh. Reduced-motion skipping is supported. No client roll or prize fields are trusted.

Click targets appear about every ten seconds for five seconds, awarding 20 clicks worth of points (50 on every fifth). Six full-value clicks/sec, 10% rewards above that, and a ranked transport limiter reduce automation advantage. Spacebar clicking is disabled. Harder daily goals rotate between 500–1,000 clicks, 20–30 targets and 10–15 upgrades. Collection milestones, hourly catch events and shared milestones add other rewards.

## Interface and hosting

White backdrop by default, handwritten font, hand-drawn SVG icons, upgrade-first shop and prominent whole-site Backdrops. Photo faces retain their original appearance, with cached masks and an iPhone image fallback. Twenty-six Justins include the chair, stairs and purple photos plus Loki's drawn green/gold costume around the original face. The Justin shop is sorted by click power, including roll-only faces. Late-game purchasable power: Passport 180, Miles 200, Hamster 225, Chairman 250, Stairwell 275, Purple 300, Loki 325 (200M). Golden now adds 210 and Rainbow 235. Existing prices stay. Gold/gems remain roll-only. Clipped, cached glints follow the actual face through its dance, including the iPhone fallback. Chairman has golden scan lines, Stairwell blue electricity, Purple violet ripples and Loki green magic; reduced motion freezes these effects. Apple Music mode is paused. No token shop, weekly themed collection or showcase.

GitHub Pages serves the frontend; Railway provides shared username/password accounts, server-checked rankings and private SQLite storage. Persistent volume `/data`, one replica, Node 24, no dependency installation. Session cookies roll for 30 days; a first-party Railway account mode handles blocked cross-site cookies. Private databases/credentials are excluded from release packages.

The protected jacob account manages delegated admins, gifts/removals, titles, timed boosts, sound mutes, second-based announcements and recoverable season resets. Local guest saves stay separate. Rebirths are personal; this update never resets all players or auto-rebirths anyone.

Only the immutable owner account can inspect/download another player's complete game save or open a separate play-as view. Passwords, hashes and session credentials are never exposed or replaced. Every view opening and batch of play actions is attributed to the owner in the audit history. The player's own login remains valid, owner presence is kept separate, and an exit link returns to the owner's account. Delegated admins cannot impersonate or inspect accounts. Read-only inspection does not settle offline income or modify the save.

Backdrop cards show category headings, pictures and prices without individual names. Gift disclosures retain their expanded state while live counters update. Leaderboards replace rows after a successful refresh and retain fixed dialog geometry/scroll position. Bunny Justin replaces Computer Lab Justin using the same save ID, 6M price and +130 permanent click bonus.

Admin points and temporary multipliers can target all accounts, one player, or online players only. Online presence uses authenticated play heartbeats and expires after ten seconds; hidden pages and logout remove presence. Admin writes and offline settlements cannot make someone online. Online deliveries snapshot recipients at send time; late joiners are excluded, and recipients retain a granted multiplier until it expires or is cancelled. Existing deliveries remain reclaimable. Announcements use a nonblocking animated popup with a hand-drawn speaker icon, countdown bar, dismiss button and reduced-motion support; unchanged notices keep their DOM nodes rather than replaying the entrance or sound on every update.

Validation: seventeen suites covering rules, timing, accounts, catch-up thresholds, exact box probabilities, owner inspection/impersonation permissions, offline earnings, gifts/rolls, rebirth resets and preservation, replay safety, storage persistence and live events. Run test-clicker.cjs, test-gui-audio.cjs and the current test-*.mjs suites individually with Node. Browser checks include stable gift disclosure and leaderboard dimensions across refreshes, owner save inspection/play-as, the Bunny costume, aquarium, spinner and manual roll queue.


## Mid/endgame and ambient distractions

Five additional gear tiers: Prismatic gaming mouse (+500/click, 8M base), Justin reactor (+3,000/sec, 25M), Orbital studio (+12,000/sec, 250M), Reality server (+50,000/sec, 2.5B), Time machine (+200,000/sec, 25B). Existing cost growth/level caps and rebirth rules apply. Late-tier shop cards and rare characters have a subtle procedural glint; no Minecraft texture is copied.

Ten permanent cosmetic distractions are purchased with points in the Distractions shop category. DVD Justin 1,500; Tiny runner 5,000; Side-eye peek 8,000; Marble race 15,000; Spinning Justin 25,000; Aquarium 50,000; Cursors 100,000; Download simulator 150,000; Portal 500,000; Solar system 2M. DVD and cursors bounce off screen edges; clicking DVD opens a dismissible fake ad in a corner. The tiny runner uses the screen bottom; Marble race now supplies an original three-lane runner video there. A glass aquarium with Justin fish overlays the click area without blocking clicks. The download bar sits below skin progress and stays at 99%. An occasional portal opens a separate justin-dimension.html page when it or Justin is clicked. Side-eye peeks occasionally then briefly jumpscares; reduced motion disables the scare. The fidget spinner responds to drag/flick and coasts with friction. These add no earning power and survive rebirth. Visibility/pause are device settings. Reduced motion, background-tab/dialog suspension, capped canvas sizes and a shared 30fps clock limit rendering work. Inspiration: https://neal.fun/stimulation-clicker/ ; native canvas/CSS uses the supplied original Justin photos.

## GUI sounds

Separate on/off, meme opt-out, volume and test controls in Settings. Purchases play an original synthesized cha-ching cash-register WAV, including when meme reactions are disabled. Synthesized UI clicks and four short downloaded Myinstants clips cover achievements (Anime Wow), announcements (Metal Gear alert), duplicate rolls (Bruh), and catches/distraction unlocks (duck). Samples are fetched from the local game assets after a gesture; players do not contact Myinstants during gameplay. Clips are capped to 2.2 seconds, volume-limited and throttled. Admin muting stops current voices and prevents new ones. Existing custom click sounds/music remain separate. Full source pages and upload attribution are in sound-credits.html and assets/gui-sfx/sources.json. No redistribution license is inferred from an upload listing.

Tests include test-distractions.mjs (server-validated unlocks/prices, rebirth retention, forged/duplicate requests) and test-gui-audio.cjs (gesture unlock, decoded clips, throttling, separate preferences, hidden-tab silence and admin muting). Local QA used a separate localhost account/database; real preview progression was not seeded or reset. Browser checked background-free effects inside the playfield, click-through, sound settings, store tabs and an empty console error log. A stale reconnect status was also corrected after successful synchronization.
