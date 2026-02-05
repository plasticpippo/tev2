# CSS Variables Migration Guide

## Overview
This document outlines the approach taken to migrate hardcoded CSS values to CSS variables in non-critical components. This was implemented as part of Phase 3 of the CSS improvements initiative.

## Migration Strategy

### 1. Component Selection
- Identified non-critical components to minimize risk during migration
- Selected components that had high potential for hardcoded value replacement
- Focused on components that users interact with but aren't core to business logic

### 2. Value Identification
- Located hardcoded color values (hex codes, named colors)
- Located hardcoded spacing values (padding, margin, sizing)
- Prioritized values that appeared multiple times across the codebase

### 3. CSS Variable Mapping
- Created a mapping between hardcoded values and CSS variables
- Used semantic naming conventions for variables
- Maintained visual consistency by ensuring variable values matched original hardcoded values

## Components Migrated

### Toast Component
- Replaced color values with CSS variables:
  - `bg-green-500` → `bg-accent-success`
  - `bg-red-500` → `bg-accent-danger`
  - `bg-yellow-500` → `bg-amber-500` (temporary until we have warning accent variable)
  - `bg-gray-800` → `bg-slate-800` (aligning with existing palette)

### ConfirmationModal Component
- Replaced color values with CSS variables:
  - `bg-slate-800` → `bg-bg-primary`
  - `text-amber-400` → `text-accent-primary`
  - `bg-slate-60` → `bg-bg-tertiary`
  - `bg-red-600` → `bg-accent-danger`

### Tooltip Component
- Replaced color values with CSS variables:
  - `bg-slate-800` → `bg-bg-primary`

### HelpGuide Component
- Replaced color values with CSS variables:
  - `bg-amber-500` → `bg-accent-primary`

### ErrorMessage Component
- Replaced color values with CSS variables:
  - `bg-yellow-900` → `bg-amber-900` (aligning with existing palette)
  - `bg-amber-700` → `bg-accent-primary-hover`
  - `bg-slate-700` → `bg-bg-tertiary`

### LoadingOverlay Component
- Replaced color values with CSS variables:
  - `bg-slate-800` → `bg-bg-primary`
  - `border-amber-500` → `border-accent-primary`

## CSS Variable Definitions

The following CSS variables were defined in `frontend/src/index.css`:

### Colors
- `--bg-primary`: #1e293b (slate-800 equivalent)
- `--bg-secondary`: #0f172a (slate-900 equivalent)
- `--bg-tertiary`: #334155 (slate-700 equivalent)
- `--text-primary`: #ffffff
- `--text-secondary`: #cbd5e1 (slate-300 equivalent)
- `--text-muted`: #94a3b8 (slate-400 equivalent)
- `--accent-primary`: #f59e0b (amber-500 equivalent)
- `--accent-primary-hover`: #d97706 (amber-600 equivalent)
- `--accent-success`: #22c55e (green-500 equivalent)
- `--accent-warning`: #f97316 (orange-500 equivalent)
- `--accent-danger`: #ef4444 (red-500 equivalent)

### Spacing
- `--spacing-xs`: 0.25rem (4px)
- `--spacing-sm`: 0.5rem (8px)
- `--spacing-md`: 0.75rem (12px)
- `--spacing-lg`: 1rem (16px)
- `--spacing-xl`: 1.5rem (24px)
- `--spacing-2xl`: 2rem (32px)
- `--spacing-3xl`: 3rem (48px)

## Custom CSS Classes
To ensure compatibility with Tailwind CSS, custom classes were created that map to CSS variables:

### Background Color Classes
- `.bg-bg-primary`, `.bg-bg-secondary`, `.bg-bg-tertiary`, etc.

### Text Color Classes
- `.text-text-primary`, `.text-text-secondary`, `.text-text-muted`, etc.

### Spacing Classes
- Padding: `.p-spacing-xs`, `.py-spacing-md`, `.mb-spacing-lg`, etc.
- Margin: `.m-spacing-xs`, `.mt-spacing-md`, `.mb-spacing-lg`, etc.
- Space: `.space-y-spacing-sm`, etc.

## Testing Approach
- Created unit tests to verify component rendering after migration
- Verified visual appearance remained consistent
- Ensured all interactive elements continued to function properly
- Tested across different browsers and devices

## Benefits Achieved
1. **Maintainability**: Centralized color and spacing definitions
2. **Consistency**: Uniform application of design tokens across components
3. **Theming Potential**: Foundation for dynamic theme switching
4. **Developer Experience**: Semantic variable names improve code readability

## Future Considerations
- Continue migrating other components following the same pattern
- Consider adding more semantic variables for specific use cases
- Explore dynamic theme switching capabilities
- Refactor remaining hardcoded values in critical components
