# Button Size Discrepancy Bug Report

## Issue Summary
There is a known bug where button sizes may appear differently between the customization modal and the POS view due to different rendering mechanisms.

## Root Cause Analysis

### Customization Modal Rendering
In `frontend/components/GridLayoutSection.tsx`, grid items are rendered using absolute positioning:
```tsx
style={{
  left: `${item.x * 100}px`,
  top: `${item.y * 100}px`,
  width: `${item.width * 100}px`,
  height: `${item.height * 100}px`,
}}
```

### POS View Rendering
In `frontend/components/ProductGrid.tsx`, grid items are rendered using CSS Grid:
```tsx
style={{
  gridColumn: `${gridItem.x + 1} / span ${gridItem.width}`,
  gridRow: `${gridItem.y + 1} / span ${gridItem.height}`,
}}
```

## Technical Explanation
1. **Customization Modal**: Uses fixed pixel calculations where `width = item.width * 100px` and `height = item.height * 100px`
2. **POS View**: Uses CSS Grid spanning where the actual pixel dimensions depend on the grid container's column/row sizes

The CSS Grid approach in the POS view calculates dimensions based on:
- Number of columns defined in the grid (`gridTemplateColumns: repeat(${currentLayout.layout.columns}, 1fr)`)
- Available container width
- Gap settings between grid items

## Impact
- Users may see different button sizes in the customization interface versus the actual POS interface
- This creates confusion as the preview during customization doesn't accurately reflect the final appearance
- The saved layout dimensions are correctly stored, but visual representation differs between views

## Expected Behavior
Button sizes should appear consistently between the customization modal and POS view to provide accurate visual feedback to users.

## Recommended Fix
Align the rendering approach between both views by:
1. Using the same CSS Grid methodology in the customization modal
2. Calculating actual pixel dimensions based on the same grid constraints used in the POS view
3. Ensuring consistent gap and spacing calculations between both interfaces

## Workaround
Users should test layouts in the POS view after customization to verify actual button sizes, as the customization modal may not accurately represent final dimensions.