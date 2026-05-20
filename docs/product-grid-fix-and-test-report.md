# Product Grid: Comprehensive Fix & Test Report

**Date:** 2026-05-20
**Scope:** Product grid rendering, edit mode, responsive layout across devices
**Components:** `ProductGridLayout`, `DraggableProductButton`, `useViewport`, `index.css`, `LayoutContext`, `MainPOSInterface`, `CategoryTabs`

---

## Executive Summary

The product grid has **3 critical layout-breaking bugs** and **5 high-severity issues** discovered through code review and browser testing at 8 different viewport sizes (320x568 to 1920x1080). The root causes are:

1. **Breakpoint collision** between the main page layout (side-by-side vs mobile tabs) and the grid column count, causing the grid to overflow into the order panel at tablet sizes.
2. **Grid overflow** on very small viewports where 2-column cards exceed their container width.
3. **Category tabs not scrollable** on smaller screens, hiding half the categories.

The grid's internal mechanics (position remapping, edit mode, drag-and-drop, touch support) are well-implemented. The issues are almost entirely in responsive CSS breakpoints and container sizing.

---

## Browser Test Results

Screenshots saved at `test-files/resolution-{WIDTH}x{HEIGHT}.png`.

| Viewport | Columns (CSS) | Columns (JS) | Side-by-side? | Grid Overflow | Notes |
|---|---|---|---|---|---|
| 1920x1080 | 4 | 4 | Yes | None | Perfect |
| 1366x768 | 4 | 4 | Yes | ~18px minor | Acceptable |
| 1024x768 | 4 | 4 | Yes | **259px into order panel** | Broken |
| 768x1024 | 4 | 4 | Yes | **362px into order panel** | Broken |
| 414x896 | 3 | 3 | No (mobile tabs) | **~110px past container** | Broken |
| 390x844 | 3 | 3 | No | None visible | OK |
| 375x667 | 3 | 3 | No | None visible | OK |
| 320x568 | 2 | 2 | No | **~40px past container** | Broken |

---

## Issues Found

### CRITICAL (layout-breaking)

#### C1. Grid columns overflow into order panel at tablet resolutions (768px-1024px)

- **Files:** `MainPOSInterface.tsx:118-140`, `index.css:176-196`, `useViewport.ts`
- **Symptom:** At 768x1024 and 1024x768, the side-by-side layout is active (Tailwind `md:flex` at >=768px). The order panel takes 320-384px (`md:w-80 lg:w-96`). The product grid area is only 384-608px wide. But the CSS grid forces 4 columns at >=768px, creating cards that are 150-200px each, totalling 600-800px - overflowing 259-362px into the order panel.
- **Root cause:** Two independent responsive systems collide:
  1. `MainPOSInterface.tsx` uses Tailwind's `md` breakpoint (768px) to switch from mobile tabs to side-by-side layout
  2. `index.css` uses `@media (min-width: 768px)` to switch the grid from 3 to 4 columns
  3. `useViewport.ts` uses `MOBILE_BREAKPOINT = 768` to report `currentGridColumns = 4`
  
  At exactly 768px, the grid gets 4 columns but only ~384px of space (after the order panel). Each card at `aspect-ratio: 4/3` needs ~150px minimum to be usable, so 4 columns = ~600px minimum, which doesn't fit.

- **Fix options:**
  - **Option A (Recommended):** Change the grid's CSS and JS breakpoints to use the *grid container width* instead of viewport width. Use CSS container queries (`@container`) - the `@tailwindcss/container-queries` plugin is already installed. Set the product grid container as a containment context and use `@grid-cols-3` / `@grid-cols-4` based on container size, not viewport size.
  - **Option B:** Raise the side-by-side layout breakpoint from `md` (768px) to `lg` (1024px) or higher. This means tablets would use the mobile tab-based view, which works correctly.
  - **Option C:** Make the order panel narrower on tablets, or overlay it instead of side-by-side.

#### C2. Grid cards overflow container at 320px and 414px

- **Files:** `index.css:176-182`, `ProductGridLayout.tsx:327-446`
- **Symptom:** At 320px, 2-column cards total ~328px but the container is only ~288px. At 414px, 3-column cards total ~492px but the container is ~382px.
- **Root cause:** The `.product-grid-container` uses `width: 100%` but the CSS Grid columns don't account for the parent padding (`p-4` = 16px each side = 32px total). Additionally, `grid-template-columns: repeat(N, 1fr)` with gap can sometimes produce columns wider than `(container - padding) / N` due to fractional rounding.
- **Fix:** Add `box-sizing: border-box` and `max-width: 100%` to `.product-grid-container`. Consider using `minmax(0, 1fr)` instead of `1fr` to prevent columns from overflowing: `grid-template-columns: repeat(N, minmax(0, 1fr))`. Also verify the padding chain from `MainPOSInterface` down to the grid doesn't compound.

#### C3. Category tabs hidden on smaller screens with no scroll indication

- **Files:** `CategoryTabs.tsx:32`, `ProductGridLayout.tsx:333-336`
- **Symptom:** At all viewports below ~1000px, category buttons "Spirits", "Soft Drinks", "Coffee", and "Tutti" are pushed off-screen. The `overflow-x-auto` is present on the tabs container, but `scrollbar-hide` class hides the scrollbar, and there's no visual indicator that more tabs exist.
- **Root cause:** `CategoryTabs.tsx:32` has `scrollbar-hide` class which removes the scrollbar. No fade/gradient indicator or "more" hint.
- **Fix:** Remove `scrollbar-hide` or add a fade gradient on the right edge to indicate scrollable content. Alternatively, wrap tabs to multiple rows on smaller screens.

---

### HIGH (significant visual/functional issues)

#### H1. JS/CSS breakpoint desynchronization during resize

- **Files:** `index.css:176-196` + `useViewport.ts:15-50`
- **Symptom:** During window resize, CSS media queries apply instantly but `useViewport` updates after a 150ms debounce. For that gap, the CSS shows N columns but JS renders N+1 drop cells (or vice versa), causing a brief visual glitch.
- **Root cause:** Two independent responsive systems (CSS media queries and React state) both determine column count.
- **Fix:** Drive column count from CSS only. Use `getComputedStyle` to read the actual `grid-template-columns` from the DOM, or use CSS container queries (eliminating the need for `useViewport` column logic entirely).

#### H2. `document.documentElement.clientWidth` vs `window.innerWidth` mismatch

- **File:** `useViewport.ts:23`
- **Symptom:** Currently the code uses `document.documentElement.clientWidth` which is correct (excludes scrollbar). No issue here - the previous report was wrong. However, verify this works correctly in all browsers.
- **Status:** Actually correct. No fix needed.

#### H3. Grid lines overlay and drop cells may misalign with actual buttons

- **Files:** `index.css:239-266` (`.product-grid-lines`) + `ProductGridLayout.tsx:362-377`
- **Symptom:** The edit-mode grid lines overlay uses the same CSS Grid structure as the product grid, but it's positioned `absolute` inside the `relative` parent. The grid lines container and the product grid container are siblings, both using the same `grid-template-columns`, so they should align. However, the grid lines container has `inset: 0` and separate padding, which could cause offset.
- **Root cause:** The grid lines overlay at `ProductGridLayout.tsx:363` uses `class="absolute inset-0 pointer-events-none z-0 p-4 product-grid-lines"`. The product grid container at line 392 uses `class="product-grid-container relative z-10"`. Both are children of `<div className="relative w-full h-full p-4">` (line 341). The grid lines have their own `p-4`, adding double padding on top of the parent's `p-4`.
- **Fix:** Remove `p-4` from the grid lines overlay, since the parent already has `p-4`. The grid lines CSS already has `padding: inherit`.

#### H4. Grid row count may be insufficient when unpositioned items overflow

- **File:** `ProductGridLayout.tsx:217-244`
- **Symptom:** `tempPositions` places unpositioned items starting from `maxRow + 1`. But if the grid has many unpositioned items, `gridRows` might not account for all of them when combined with remapping.
- **Root cause:** The calculation at line 244 (`gridRows = Math.max(remappedMaxRow + tempRowsNeeded, 5)`) looks correct. However, `remappedMaxRow` is only computed for positioned items. If no items are positioned, `maxRow = 0`, so `remappedMaxRow = 0`, and `tempRowsNeeded` handles unpositioned items. This should work correctly.
- **Status:** Appears correct. Verify with edge case of 0 positioned items + many unpositioned items.

#### H5. Position collision after remapping not fully resolved

- **File:** `DraggableProductButton.tsx:15-37` (`resolveRemappedPositions`)
- **Symptom:** The `resolveRemappedPositions` function does implement collision resolution (lines 24-31), pushing items to the next available cell. This is already handled.
- **Status:** Already fixed. No action needed.

---

### MEDIUM (degraded experience)

#### M1. `100vh` used instead of `100dvh` for mobile Safari

- **Files:** Various layout files using `h-screen` (Tailwind's `h-screen` = `100vh`)
- **Symptom:** On mobile Safari, the address bar reduces the visible area. `100vh` includes the address bar area, causing the grid to extend below the visible viewport.
- **Fix:** Use `h-dvh` (Tailwind v3.4+) or set `height: 100dvh` in CSS.

#### M2. No orientation change handling beyond debounced resize

- **File:** `useViewport.ts:35-39`
- **Symptom:** Device rotation triggers the `orientationchange` listener which is already present (line 35-39). No issue here.
- **Status:** Already handled.

#### M3. Virtual keyboard open/close triggers resize recalculation

- **File:** `useViewport.ts:23-26`
- **Symptom:** On mobile, opening the virtual keyboard changes `document.documentElement.clientHeight`, which can trigger layout shifts if any logic depends on viewport height. The current code only checks width, so this is not an issue for the grid.
- **Status:** Not an issue for the grid (width-based breakpoints only).

#### M4. No visible scrollbar on product grid scroll container

- **Files:** `MainPOSInterface.tsx:125-130` and `ProductGridLayout.tsx:340`
- **Symptom:** The product grid's scroll container (`overflow-y-auto`) may have a hidden scrollbar depending on OS settings. Users may not realize there are more items below.
- **Fix:** Consider adding a fade gradient at the bottom of the grid to indicate scrollable content.

#### M5. Excessive scrolling on mobile for large product lists

- **Symptom:** At 375px with 22 items in 3 columns, users see only 6-8 items initially and must scroll extensively.
- **Fix:** This is inherent to the grid design. Consider smaller card sizes on mobile or a list view option.

---

### LOW (minor/code quality)

| # | Issue | File | Fix |
|---|-------|------|-----|
| L1 | Debug `console.log` left in production | `ProductGridLayout.tsx:247-258` | Remove or gate behind `import.meta.env.DEV` |
| L2 | `useViewport` debounced but could use `requestAnimationFrame` | `useViewport.ts:28-30` | Minor perf improvement |
| L3 | Edit-mode emoji "⚠️" violates "no emojis" rule | `ProductGridLayout.tsx:382` | Replace with text or icon |

---

## Recommended Fix Plan

### Phase 1: Critical Fixes

**Step 1 -- Fix tablet grid overflow (C1)**

This is the highest-impact fix. Two viable approaches:

**Option A (Container queries - recommended):**
1. In `MainPOSInterface.tsx`, wrap the product grid area in a container query context:
   ```tsx
   <div className="flex-1 min-w-0 h-full flex flex-col relative z-20 @container">
   ```
2. In `index.css`, replace viewport media queries with container queries:
   ```css
   .product-grid-container {
     display: grid;
     grid-template-columns: repeat(2, minmax(0, 1fr));
     gap: clamp(0.375rem, 1.5vw, 1rem);
     width: 100%;
     container-type: inline-size;
   }
   @container (min-width: 350px) {
     .product-grid-container { grid-template-columns: repeat(3, minmax(0, 1fr)); }
   }
   @container (min-width: 550px) {
     .product-grid-container { grid-template-columns: repeat(4, minmax(0, 1fr)); }
   }
   ```
3. In `useViewport.ts`, read the actual column count from the DOM instead of using viewport breakpoints, or keep the JS breakpoints but adjust them to account for the order panel width.

**Option B (Raise side-by-side breakpoint):**
1. In `MainPOSInterface.tsx`, change `md:flex` to `lg:flex` and `md:hidden`/`md:flex` to `lg:hidden`/`lg:flex`.
2. This makes tablets (768-1023px) use the mobile tab-based view instead of the broken side-by-side layout.

**Option C (Adaptive order panel):**
1. At `md` (768px), use a narrower order panel or overlay it.
2. At `lg` (1024px), use the full side-by-side layout.

**Verify:** Test at 768x1024 and 1024x768 - grid must fit within the product area without overflow.

**Step 2 -- Fix grid card overflow at 320px and 414px (C2)**

1. In `index.css`, change `grid-template-columns: repeat(N, 1fr)` to `repeat(N, minmax(0, 1fr))` for all breakpoints:
   ```css
   .product-grid-container {
     grid-template-columns: repeat(2, minmax(0, 1fr));
   }
   ```
2. Add `overflow: hidden` to `.product-grid-container` or its parent if needed.
3. Verify the padding chain: `MainPOSInterface` (p-4) -> grid wrapper (p-4) -> `.product-grid-container`. Ensure no double-padding causes width issues.

**Verify:** Test at 320x568 and 414x896 - cards must not overflow their container.

**Step 3 -- Fix category tabs visibility (C3)**

1. In `CategoryTabs.tsx`, remove `scrollbar-hide` from the tabs container class.
2. Add a right-edge fade gradient to indicate more tabs:
   ```css
   .category-tabs-container {
     mask-image: linear-gradient(to right, black 90%, transparent 100%);
   }
   ```
   Or add a "scroll right" arrow button that appears when tabs overflow.

**Verify:** At 375x667, all 8 category buttons should be reachable by scrolling.

### Phase 2: High-Priority Fixes

**Step 4 -- Fix grid lines double padding (H3)**

1. In `ProductGridLayout.tsx:363`, remove `p-4` from the grid lines overlay:
   ```tsx
   <div className="absolute inset-0 pointer-events-none z-0 product-grid-lines">
   ```

**Step 5 -- Synchronize JS and CSS breakpoints (H1)**

1. If using container queries (Step 1 Option A), eliminate `useViewport`'s column logic and read columns from the DOM:
   ```ts
   const getColumnCount = () => {
     const grid = document.querySelector('.product-grid-container');
     if (!grid) return 4;
     return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
   };
   ```
2. If not using container queries, ensure `useViewport` breakpoints match CSS breakpoints exactly.

**Step 6 -- Remove debug logging (L1)**

1. Remove or gate the `console.log` in `ProductGridLayout.tsx:247-258`.

### Phase 3: Polish

**Step 7 -- Replace emoji with icon (L3)**
- Replace the warning emoji at `ProductGridLayout.tsx:382` with a text-based or SVG icon.

**Step 8 -- Mobile viewport height (M1)**
- Replace `h-screen` with `h-dvh` in `MainPOSInterface.tsx`.

---

## Test Plan

### Test Matrix

| ID | Viewport | Layout Mode | Category | Mode | Expected Result |
|---|---|---|---|---|---|
| T1 | 1920x1080 | Side-by-side | Preferiti | Normal | 4 columns, no overflow, all items visible |
| T2 | 1920x1080 | Side-by-side | Preferiti | Edit | Each item exactly once, grid lines aligned |
| T3 | 1366x768 | Side-by-side | Preferiti | Normal | 4 columns, minimal/no overflow |
| T4 | 1024x768 | Side-by-side | Preferiti | Normal | Grid fits in product area, no overflow into order panel |
| T5 | 768x1024 | Side-by-side or mobile | Preferiti | Normal | Grid fits in available space, no overflow |
| T6 | 768x1024 | Side-by-side or mobile | Preferiti | Edit | Grid lines align with cells, drop zones correct |
| T7 | 414x896 | Mobile tabs | Preferiti | Normal | 2-3 columns, cards fit container width |
| T8 | 375x667 | Mobile tabs | Preferiti | Normal | 3 columns, no overflow |
| T9 | 320x568 | Mobile tabs | Preferiti | Normal | 2 columns, cards fit within container |
| T10 | 320x568 | Mobile tabs | Tutti | Normal | All items visible, scrollable |
| T11 | 375x667 | Mobile tabs | All categories | Normal | All category buttons reachable |
| T12 | 768x1024 | Side-by-side | Wine | Edit | Drop an item, save, verify at 1920px position is valid |

### Playwright MCP Test Sequence

```
1. Navigate to http://192.168.1.70, log in as admin/admin123
2. For each viewport in [320x568, 375x667, 414x896, 768x1024, 1024x768, 1366x768, 1920x1080]:
   a. Resize browser to viewport
   b. Wait 500ms for layout to settle
   c. Take screenshot
   d. Take accessibility snapshot
   e. Count visible grid columns
   f. Verify column count matches expected for available container width
   g. Check for any elements with x-coordinates exceeding container bounds
   h. Check category tabs are all reachable (scroll if needed)
   i. Enter edit mode
   j. Snapshot again
   k. Verify no duplicate product items in accessibility tree
   l. Verify grid lines align with product card boundaries
   m. Exit edit mode
3. Cross-device persistence test:
   a. At 375x667, enter edit mode, drag an item
   b. Save
   c. Resize to 1920x1080
   d. Verify the item's position is valid (column 1-4)
4. Touch test (Chrome DevTools touch emulation):
   a. Enable touch at 375x667
   b. Long-press a product, drag to new position
   c. Release, verify no ghost element
   d. Verify position saved correctly
```

### Regression Checklist

After all fixes:
- [ ] Normal mode: grid renders correctly at 320, 375, 414, 768, 1024, 1366, 1920px
- [ ] No grid overflow into order panel at any viewport
- [ ] No card overflow past container boundaries at any viewport
- [ ] All category tabs reachable at all viewports
- [ ] Edit mode: no duplicate items at any viewport
- [ ] Edit mode: grid lines align with cell boundaries at all viewports
- [ ] Edit mode: drop zones same height as buttons
- [ ] Drag-and-drop works with mouse on desktop
- [ ] Drag-and-drop works with touch on mobile (no stuck drag)
- [ ] Saving on mobile produces valid 4-column positions
- [ ] Switching from mobile to desktop shows correct layout
- [ ] "Tutti" (all products) category renders without overflow
- [ ] Virtual keyboard open/close doesn't break grid layout
- [ ] Category switching preserves layout correctly
