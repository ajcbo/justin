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

Click targets appear about every ten seconds for five seconds, awarding 20 clicks worth of points (50 on every fifth). A timing ring closes on the target every 1.1 seconds, starting one beat after it opens: presses within 90 ms of a beat are Perfect (2× bonus), within 220 ms Great (1.5×), otherwise Good (1×). The server grades the same press timestamp, so client-sent bonuses or grades are ignored. No target spawns over Justin's face. Six full-value clicks/sec, 10% rewards above that, and a ranked transport limiter reduce automation advantage. Spacebar clicking is disabled. Harder daily goals rotate between 500–1,000 clicks, 20–30 targets and 10–15 upgrades. Collection milestones, five-minute Justin Invasions and shared milestones add other rewards.

## Interface and hosting

White backdrop by default, handwritten font, hand-drawn SVG icons, upgrade-first shop and prominent whole-site Backdrops. Photo faces retain their original appearance, with cached masks and an iPhone image fallback. Twenty-seven Justins include the chair, stairs and purple photos plus Loki's drawn green/gold costume and Invader Justin's space suit around the original face. The Justin shop is sorted by click power, including roll-only faces. Late-game purchasable power: Passport 180, Miles 200, Hamster 225, Chairman 250, Stairwell 275, Purple 300, Loki 325 (200M). Golden now adds 210 and Rainbow 235. Existing prices stay. Gold/gems remain roll-only. Clipped, cached glints follow the actual face through its dance, including the iPhone fallback. Chairman has golden scan lines, Stairwell blue electricity, Purple violet ripples and Loki green magic; reduced motion freezes these effects. Apple Music mode is paused. No token shop, weekly themed collection or showcase.

GitHub Pages serves the frontend; Railway provides shared username/password accounts, server-checked rankings and private SQLite storage. Persistent volume `/data`, one replica, Node 24, no dependency installation. Session cookies roll for 30 days; a first-party Railway account mode handles blocked cross-site cookies. Private databases/credentials are excluded from release packages.

The protected jacob account manages delegated admins, gifts/removals, titles, timed boosts, sound mutes, second-based announcements and recoverable season resets. Local guest saves stay separate. Rebirths are personal; this update never resets all players or auto-rebirths anyone.

Only the immutable owner account can inspect/download another player's complete game save or open a separate play-as view. Passwords, hashes and session credentials are never exposed or replaced. Every view opening and batch of play actions is attributed to the owner in the audit history. The player's own login remains valid, owner presence is kept separate, and an exit link returns to the owner's account. Delegated admins cannot impersonate or inspect accounts. Read-only inspection does not settle offline income or modify the save.

Backdrop cards show category headings, pictures and prices without individual names. Gift disclosures retain their expanded state while live counters update. Leaderboards replace rows after a successful refresh and retain fixed dialog geometry/scroll position. Bunny Justin replaces Computer Lab Justin using the same save ID, 6M price and +130 permanent click bonus.

Admin points and temporary multipliers can target all accounts, one player, or online players only. Online presence uses authenticated play heartbeats and expires after ten seconds; hidden pages and logout remove presence. Admin writes and offline settlements cannot make someone online. Online deliveries snapshot recipients at send time; late joiners are excluded, and recipients retain a granted multiplier until it expires or is cancelled. Existing deliveries remain reclaimable. Announcements use a nonblocking animated popup with a hand-drawn speaker icon, countdown bar, dismiss button and reduced-motion support; unchanged notices keep their DOM nodes rather than replaying the entrance or sound on every update.

Validation: twenty-three suites covering rules, timing, accounts, catch-up thresholds, exact box probabilities, owner inspection/impersonation permissions, offline earnings, gifts/rolls, rebirth resets and preservation, replay safety, storage persistence, live events, chat/profile permissions, long combos and legacy inventory recall. Run test-clicker.cjs, test-gui-audio.cjs and the current test-*.mjs suites individually with Node. Browser checks include stable gift disclosure and leaderboard dimensions across refreshes, owner save inspection/play-as, typed account targets, profile editing, chat delivery, the Bunny costume, aquarium, spinner and manual roll queue.

## Accounts, chat and long combos

Signed-in players can change their username, choose an owned Justin as their chat avatar and select a name colour from the account window. Names use 3–20 letters, numbers or underscores and remain unique without regard to case. Names change the existing account; saves, sessions and owner/admin access stay bound to its immutable account ID. The original owner handle remains reserved. All admin account targets use typed usernames, which remain intact through panel refreshes.

Player chat uses the existing authenticated live stream, with 40 recent messages displayed and at most 200 retained. Guests must sign in to read or send chat. Messages are plain text, limited to 180 characters, with a two-second send interval and retry protection. Players may remove their own messages; admins may remove others, while delegated admins cannot remove the owner's messages. Owner play-as continues chatting as the actual owner account. Chat carries no passwords, session tokens or other players' private saves.

Combos count valid, ordered physical click timestamps independently of the currency transport limiter, so fast inputs do not vanish from the ranked best combo. Delayed input events use their actual press time. The old 9,999 cap is removed (safe maximum: one trillion), saved best never drops on an acknowledgement and earning a 5,000-click roll does not interrupt a streak. The 650ms combo window, point limits, pitch ceiling and full-value roll eligibility remain.

The private management command `audit-boxes` reconstructs old 25,000-point mystery-box acquisitions from retained receipts, roll history, daily gifts and admin audit records. `recall-boxes` is one-time and makes a compressed consistent database backup plus original-player-row archives before removing only attributable old-box variants. It preserves later gift/admin/new-price acquisitions, Golden milestone rewards, currency, upgrades and stats. Ambiguous origins are reported and left untouched. A small recall manifest filters stale receipt inventories on replay without rewriting the large receipt log. Neither the backup nor the management results belong in the public repository.


## Mid/endgame and ambient distractions

Five additional gear tiers: Prismatic gaming mouse (+500/click, 8M base), Justin reactor (+3,000/sec, 25M), Orbital studio (+12,000/sec, 250M), Reality server (+50,000/sec, 2.5B), Time machine (+200,000/sec, 25B). Existing cost growth/level caps and rebirth rules apply. Late-tier shop cards and rare characters have a subtle procedural glint; no Minecraft texture is copied.

Ten permanent cosmetic distractions are purchased with points in the Distractions shop category. DVD Justin 1,500; Tiny runner 5,000; Side-eye peek 8,000; Marble race 15,000; Spinning Justin 25,000; Aquarium 50,000; Cursors 100,000; Download simulator 150,000; Portal 500,000; Solar system 2M. DVD and cursors bounce off screen edges; clicking DVD opens a dismissible fake ad in a corner. The tiny runner uses the screen bottom; Marble race now supplies an original three-lane runner video there. A glass aquarium with Justin fish overlays the click area without blocking clicks. The download bar sits below skin progress and stays at 99%. An occasional portal opens a separate justin-dimension.html page when it or Justin is clicked. Side-eye peeks occasionally then briefly jumpscares; reduced motion disables the scare. The fidget spinner responds to drag/flick and coasts with friction. These add no earning power and survive rebirth. Visibility/pause are device settings. Reduced motion, background-tab/dialog suspension, capped canvas sizes and a shared 30fps clock limit rendering work. Inspiration: https://neal.fun/stimulation-clicker/ ; native canvas/CSS uses the supplied original Justin photos.

## GUI sounds

Separate on/off, meme opt-out, volume and test controls in Settings. Purchases play an original synthesized cha-ching cash-register WAV, including when meme reactions are disabled. Synthesized UI clicks and four short downloaded Myinstants clips cover achievements (Anime Wow), announcements (Metal Gear alert), duplicate rolls (Bruh), and catches/distraction unlocks (duck). Samples are fetched from the local game assets after a gesture; players do not contact Myinstants during gameplay. Clips are capped to 2.2 seconds, volume-limited and throttled. Admin muting stops current voices and prevents new ones. Existing custom click sounds/music remain separate. Full source pages and upload attribution are in sound-credits.html and assets/gui-sfx/sources.json. No redistribution license is inferred from an upload listing.

Tests include test-distractions.mjs (server-validated unlocks/prices, rebirth retention, forged/duplicate requests) and test-gui-audio.cjs (gesture unlock, decoded clips, throttling, separate preferences, hidden-tab silence and admin muting). Local QA used a separate localhost account/database; real preview progression was not seeded or reset. Browser checked background-free effects inside the playfield, click-through, sound settings, store tabs and an empty console error log. A stale reconnect status was also corrected after successful synchronization.

## Feel update

Clicking squashes Justin toward the press point on a damped spring (canvas and the iPhone image fallback), and points pop exactly where you press from a reused pool of 14 elements. Critical hits add a graded sticker, shockwave, star burst, small screen shake, graded chime and a short vibration where supported. The dance now changes every 25 clicks instead of every click, which removes a full-canvas copy, toast and particle burst per tap.

Shop cards show the exact change before buying (for example "25 → 33 per click (+32%)"). Affordable cards get a green edge, a short wiggle when they first become affordable and a ready count on the Upgrades/Justins tabs. Purchases stamp the card, bump the earning stat with the delta and play the cha-ching. Ranked purchases celebrate only after the server's response is reconciled.

One "next goal" card replaces the separate next-face and roll lines. It shows the most useful nearby goal: a claimable challenge or collection gift, a ready rebirth, or whichever of the next Justin, the next 5,000-click roll or the next rebirth is closest at your current rate. Achievements get a pop-up banner. Rebirth shows a now/after multiplier comparison and a keep/reset ledger with real counts. A small score pill stays visible while scrolling the shop.

Mystery-box and milestone reveals use rarity lighting (rays and tints for rare, epic, legendary, mythic), a rarity chip, NEW / DUPLICATE / POINTS stamps, ticks as cards pass the marker and rarity fanfares. Reveals remain player-started; Skip or tapping the strip jumps to the result. Duplicates say which Justin you already own and how many points they became.

Special Justins have small personalities: Chairman rocks and creaks, Stairwell hops down drawn steps, Loki throws two decoys (poke one to pop it), Hamster shrieks, Horizontal breathes and snores, Miles thwips, Purple wobbles and gem variants sparkle. Speech bubbles are rate limited. Tapping the worn Justin's name triggers their move. Other surprises: an idle Justin falls asleep and startles awake, a hidden nose boop, poking the score and a long-press inflate-and-pop. None of these award points.

Backdrops open on a large preview with category chips; tapping a picture previews it, and the hero button buys or equips. Dialogs and shop tabs animate in. Close buttons, achievements, click FX and clones use the hand-drawn icon set (new: star, sparkle, clones). The phone layout keeps Justin above the fold, and the stage background now allows vertical scrolling on touch while Justin himself still ignores scroll gestures.

Performance: particle caps are 45 on reduced-quality devices and 90 otherwise; personality effects run inside the existing 30/60 fps canvas loop, which already pauses when hidden, off-screen or behind a dialog; timers skip hidden pages. Reduced motion keeps information (points, the timing ring, results) and drops movement. test-critical-timing.mjs covers timing grades, server recomputation, forged grades and target placement.

## Cutscenes and Justin Invasion

The humour is Justin's completely normal face treated as an enormous cinematic threat. Scenes come in two kinds:

- **Blender videos** (`tools/cutscenes.py`, rendered to silent 640×360 H.264 MP4s in `assets/cutscenes`, 1.3 MB for all seven): the first-visit intro, the points/clicks milestone, the gift box (Invader/Party), and one reveal per material for first-time unlocks. Gold: darkness, a golden reflection travelling across his face, then a heavy metallic reveal. Platinum: two enormous metal shutters part through cold mist. Diamond: a suspended crystal cracks, then breaks open around him. Rainbow: colours drain from the scene, gather into a ring, then sweep back outward from his face. Justin's real photo is cut with the same outline the game uses. Clips load only when needed, play muted and inline (hardware decoding on phones), and use HTML caption overlays so one clip serves every name or number.
- **On-page scenes** (`cinema.js`, `cinema.css`): scenes that happen to the website itself, animated only with transforms and opacity. Every element is removed afterwards, and none of them grants anything.
  - Rebirth: points and upgrade icons orbit Justin faster and faster, the interface compresses into one bright dot, a brief silence, then it bursts back. The new multiplier appears first, then the reset counters.
  - Collection milestone (5/10/15/20 Justins): portraits fly into a rotating ring, the newest slides into the gap, it stops on a hit and folds into the Collection button.
  - Community milestone: players' chat avatars (or stand-ins) gather around the nearly full meter, the final +1 lands, the meter cracks open and coins fly to everyone and to your points.

Every scene is skippable (Skip button; Esc for videos). Settings has a cutscene toggle and Replay intro. Reduced motion replaces on-page scenes with short still captions and skips videos. If a video can't start within about 4.5 seconds, the game continues without it. The Node server serves `.mp4` with byte ranges (required by iPhone Safari) and caches the versioned clips for a week. Rebuild the clips with `blender -b --factory-startup -P tools/cutscenes.py` from the repository root (`ONLY=name` and `PREVIEW=frame` are optional), then bump `version` in cutscenes.js.

**Justin Invasion** runs every five minutes on the server clock and rotates between four variants (the event number decides, so server and clients agree):

| Variant | Targets | Entrance (~4s) | Ending (~2s) |
| --- | --- | --- | --- |
| Tiny Justin swarm | 20 tiny Justins bouncing across the whole screen, the second 10 arriving 30 seconds in | The music fades, one tiny Justin peeks over the bottom edge, a rumble, still heads around the edges, then the camera pulls back as dozens pour into the click area on an orchestral hit and the health bar slams down | The rest flee through a tiny door; the last one gets stuck, then pops through |
| Giant Justin | 8 glowing weak spots that light up in turn | A shadow passes over the website, dust falls from the title, two footsteps shake the page, the view tilts as he rises; one blink, a deep impact, the boss bar | He tips backwards out of view, a suspicious silence, then a distant crash |
| Loki invasion | 6 real Lokis, each between two decoys that glitch | The countdown freezes at 00:01 three times, deeper each time, as green cracks spread; Justin splits into copies that scatter into portals; the real Loki steps through the centre as the sound returns | Decoys shatter into green fragments; the real one's portal closes around his oversized helmet |
| UFO invasion | 10 Justins in small saucers that keep arriving from the mothership | A light crosses the sky, the page falls under a circular shadow, the homemade mothership descends humming, the hatch opens on one ordinary Justin face, the beam fires | The mothership retreats, loses power, then bounces away like a DVD logo |

A "Join Justin Invasion?" popup appears 20 seconds early (naming the variant) and doesn't block clicking. Joins are accepted until 90 seconds into the two-minute event. Joined players see a countdown, then the entrance plays while the 2× boost is already running. A boss bar at the top tracks time and remaining invaders. Catching all of them raises the boost to 3× and rolls a 12% chance (server randomness) for Invader Justin (+150 per click, roll-only, kept on rebirth); a duplicate gives extra points. A full clear is worth 45 seconds of earnings in every variant, split across its targets. The boost uses the same strongest-wins rule as owner boosts. Joins, catches, slot ranges, the boost and the roll are all recomputed on the server; client-sent boosts are ignored.

**Owner Cutscene Lab:** the owner panel (owner account only, not delegated admins) has a Cutscene Lab section to preview every video, the rebirth/collection/community scenes, each invasion entrance and ending, and a 40-second full practice round per variant. Previews send nothing to the server and grant no rewards.

test-invasion.mjs covers the variant rotation, per-variant target limits, the schedule, the boost maths, the catches, the odds, save validation and the server checks.

## Music and sound

All music is original and synthesized live in the browser (`soundtrack.js`): nothing is downloaded and nothing is licensed. A look-ahead 16th-note sequencer plays one theme at a time on a music bus that shares gui-audio's context, limiter and reverb room.

- **Background music** (header ♪ button or Settings, off by default): a soft lo-fi loop that gains hats, snare, pads and bells as your combo tier rises. It pauses while the "make him dance" song plays and during cutscenes.
- **Invasion themes** (Settings → invasion and cutscene music, on by default): a heartbeat-and-drone countdown that tightens as the start nears; silence during the entrance; then each variant's theme lands on the slam. Swarm is a frantic 150 BPM pluck ostinato; Giant is slow taiko and low brass; Loki is a ticking clock with whole-tone bells and glitch stutters; UFO is a theremin melody over an arpeggio. The last 10 seconds speed up, a full clear switches to a major-key victory loop, and the music fades at the end. The dance song is ducked during an event.
- **Sound effects:** cinematic hits (impacts, booms, gong, footsteps, crashes) go through a synthetic reverb. New cues: riser, sub boom, gong, shimmer, brass, heartbeat, per-variant catch sounds (squish, ow, zap, glitch), a combo tier-up chime, a ping when a critical target appears, a music box for collections, and a cheer and fanfare for community goals.
- Music volume and toggles are separate from interface sounds. Admin sound mutes, hidden tabs and reduced audio settings silence the music bus immediately.

**Custom invasion tracks:** an invasion theme can be replaced with an audio file by listing it in `assets/music/tracks.json`, for example `{"loki": "assets/music/loki.mp3"}`. It then starts with that variant's entrance and loops through the event. Only files listed there are requested. Only use audio you have the rights to publish; music ripped from YouTube or other services must not be added. Players can also pick **their own** track per invasion in Settings → Music. That file is kept only in their browser (IndexedDB), plays only for them, and is never uploaded, which is the right way to use a personal copy of a commercial song.

**Event cutscenes:** each invasion entrance now has a vignette, a riser into the reveal, a white flash and sub boom on the slam, and a trailer title card ("THEY’RE HERE.", "HE IS ENORMOUS.", "TIME IS BROKEN.", "WE ARE NOT ALONE."). During the countdown, joined players get small teasers in the stage (a tiny head peeking, footsteps with falling dust, a green glitch, a light crossing the sky). Every invasion ends with a result card: INVASION REPELLED or THEY GOT AWAY, how many were caught, and what's next.

## Cosmetics and abilities

**One appearance slot.** A cosmetic is a complete package (outfit, props, effects, animations and one ability) layered over whichever Justin is selected, so Diamond Justin can wear Justincase. Equipping another cosmetic replaces the whole package. Justins keep their bonuses; owning cosmetics adds no earnings. Ownership and the equipped cosmetic survive rebirth.

| Cosmetic | Price | Outfit | Ability (max ★) |
| --- | --- | --- | --- |
| Justin Time | 750K | crooked clock behind his head, oversized wristwatch | Time Loop (8): your clicks leave clock marks for 5 s, the playfield rewinds, and you tap each mark as its ghost cursor arrives; the clock hands snap forward |
| Justincase | 2.5M | squeezed into a battered suitcase with bouncing luggage tags | Excess Baggage (14): open bags on a tiny conveyor, match tag colours, and finish on the oversized suitcase (the supplied photo) |
| Justincredible | 8M | homemade cape and crooked chest emblem | Human Pinball (9): drag Justin back and release (or tap where to launch), 3 launches, tokens and a moving golden bumper; superhero landing, then the cape falls over his head |
| Justin Charge | 15M | battery backpack, tangled cables, static sparks | Chain Reaction (8): connect battery and machines by tapping or dragging, matching ● ■ ▲ plugs, then RELEASE; the battery ends at 1% |
| Justin Debt | 30M | loose tie, receipt folder, mini repossession truck | Borrowed Equipment (10): pick an owned upgrade, a truck delivers a giant copy for 20 s with its temporary extra earnings on screen; collect receipts; the truck repossesses only the copy |
| Justin Trouble | 50M | suspicious coat, badly attached moustache, wanted poster | Getaway (8): place up to 3 entrance/exit portal pairs to steer mini Justin past spotlights, through tokens, to the exit; he ends hiding in a cardboard box |

**Shop:** the Cosmetics button sits beside Backdrops. Cards show animated previews on your current Justin, prices and an EQUIPPED ribbon; the side panel has Try on (20 s on the real Justin), Preview ability (a full demo with no rewards and no cooldown change), Buy, Equip and Unequip.

**Ability button:** under Justin, with a charge ring and ready / cooldown / running / "after the invasion" states. One shared 3-minute cooldown covers every cosmetic; switching outfits, refreshing, other tabs and other devices all see the same server value, and the cooldown can finish offline (one stored activation). Activities need active play and only take over the click area; decorative distractions, the critical target and speech bubbles go quiet meanwhile. An activation is refused during a joined invasion (the charge is kept), and an invasion entrance waits while an activity runs.

**Rewards and validation (`cosmetics-core.js`, shared by browser and server):** each activation's budget is 15 seconds of permanent earning power (`P.scaled`, which excludes owner boosts and catch-up), fixed when it starts. Payout = budget × (35% participation + 65% × ★ / max★), so it never exceeds the budget. The server checks purchases, ownership, equipment, the cooldown, unique activation ids, every ★ hit (right activation, inside the 75-second window, at least 100 ms apart, capped per cosmetic) and settlement. Settlement is idempotent; retries return the original receipt; an interrupted or abandoned activity settles with what it had once its window closes. Ability rewards go straight to the wallet: no clicks, no full-value milestones, no Golden-roll attempts.

**Owner tools:** grant/remove a cosmetic in the owner panel (same permission rules as characters). The save inspector shows the cosmetic worn, cosmetics owned, the ability state and the last reward.

test-cosmetics.mjs covers the catalogue, no earnings bonus, the single slot, the shared cooldown across outfits/saves, capped and spaced hits, idempotent settlement, interrupted settlement, the budget excluding boosts and catch-up, no click milestones, rebirth retention, invasion coordination, forged saves, server validation, retries and owner grant/remove.
