# Larger Text for Long-Sighted Staff

## What changed

The frontend is now rem-based so font sizes scale automatically with the
**root font-size**. Two changes make the app more readable for long-sighted
(hyperopic) staff without affecting users who don't need it:

1. **Larger fluid baseline** — `frontend/src/index.css` now sets
   `:root { font-size: clamp(1.0625rem, 1rem + 0.4vw, 1.1875rem) }`
   (17px–19px instead of the 16px browser default). This is a layout-safe
   ~19% increase on typical POS screens.

2. **Full rem scaling** — the two remaining fixed-pixel text sizes
   (`text-[10px]` badges) were converted to `text-[0.625rem]` so every text
   element now follows the root size. No in-app toggle is needed.

## How long-sighted staff get even larger text (auto-detect)

Because everything is rem-based, each user controls their own size without a
setting in the app:

- **Browser zoom** — `Ctrl` + `+` / `Cmd` + `+` (or pinch-zoom on touch).
  Scales the whole interface proportionally.
- **Browser/OS default font size** — in Firefox/Chrome accessibility settings,
  raise the default font size (e.g. "Large"). The app's rem-based text grows
  accordingly; other users are unaffected.

These compound with the new baseline, so a ~40%+ increase is easily reachable
for anyone who needs it.
