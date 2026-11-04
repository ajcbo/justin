# Justin Clicker

A deliberately goofy clicker game starring Justin Tangarorang.

[Play Justin Clicker](https://ajcbo.github.io/justin/)

- Click or tap Justin to earn points and change his dance. Space also clicks; arrow keys change dances.
- Justin keeps dancing and cycling animations without music. Background music supplies its own beat timing when playing; otherwise a silent rhythm drives the animation.
- Unlock seven face versions. Face bonuses stack permanently; wear any unlocked face and keep every bonus.
- Buy stronger clicking fingers and passive generators in Bad investments.
- Click less than 0.65 seconds apart to build a combo. The voice gets higher with every hit, up to two octaves higher, while rings, glow and callouts escalate.
- Pausing resets the combo and voice pitch. Your best streak and game progress save in this browser.
- The supplied video audio is trimmed and boosted by 5 dB. The MP3 is in `assets/justin-click.mp3`; pre-decoded WAV playback makes presses responsive without MP3 encoder delay. Rapid clicks restart one voice instead of stacking audio.
- Older toys and background music are under Extra nonsense. Sound volume, mute and reduced motion are supported.

## Apple Music mode

The Apple Music visualizer is an optional mode linked from the main game. It uses Apple's official player, album artwork backgrounds, editable characters, and lyric search/import. Its lyric clock and ambient tempo are manual and separate from Apple playback. For a new song within an album or playlist, add that song link to update artwork and lyrics. Full playback requires signing in inside Apple's player.

## Run or host

This is a static website with no build step or API key. Serve this directory with any static server; GitHub Pages serves `index.html`. Photo and music replacements stay in the visitor's tab. Game saves remain in that browser, and passive points accrue while the tab is active.

Image-prop sources are listed in [image credits](image-credits.html). No AI prompt editor or paid AI service is included.
