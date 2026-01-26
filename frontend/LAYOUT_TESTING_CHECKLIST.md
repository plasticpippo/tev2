# Layout System Testing Checklist

## Prerequisites
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Database migrations applied
- [ ] At least one till exists in database
- [ ] At least one category with products exists
- [ ] At least one admin user exists
- [ ] At least one non-admin user exists

## Test Environment Setup
- [ ] Access app from: http://192.168.1.241:3000
- [ ] Open browser DevTools (F12)
- [ ] Open Network tab to monitor API calls
- [ ] Open Console tab to check for errors

---

## TEST SUITE 1: Basic Functionality (Non-Admin User)

### Login as Non-Admin
- [ ] Login with non-admin credentials
- [ ] Assign a till if needed
- [ ] Navigate to POS view

### Verify Non-Admin Restrictions
- [ ] Edit Layout button is NOT visible in Order Panel
- [ ] Products display normally in grid
- [ ] Can click products to add to cart
- [ ] Category tabs work (Favourites, Drinks, Food, etc.)
- [ ] All existing POS functionality works
- [ ] No layout-related errors in console

### Verify Products Display Correctly
- [ ] Products show correct colors (backgroundColor, textColor)
- [ ] Product names display
- [ ] Variant names display
- [ ] Prices display correctly
- [ ] Favourite star appears on favourite items
- [ ] Out of stock items show "OUT OF STOCK" overlay
- [ ] Grid is 4 columns wide
- [ ] Products are clickable

---

## TEST SUITE 2: Edit Mode Access (Admin User)

### Login as Admin
- [ ] Logout from non-admin account
- [ ] Login with admin credentials
- [ ] Assign a till if needed
- [ ] Navigate to POS view

### Verify Admin UI Elements
- [ ] Edit Layout button IS visible in Order Panel
- [ ] Button says "Edit Layout" with icon
- [ ] Button is styled (purple background)
- [ ] Clicking button enters edit mode

### Enter Edit Mode
- [ ] Click "Edit Layout" button
- [ ] Order Panel is covered by edit toolbar
- [ ] Toolbar shows "EDIT MODE" header in yellow
- [ ] Instructions are visible
- [ ] Save button is disabled (no changes yet)
- [ ] Cancel button is visible
- [ ] Reset button is visible
- [ ] Grid overlay appears on product area
- [ ] Product buttons show yellow rings
- [ ] Product buttons show drag handles (⋮⋮)

---

## TEST SUITE 3: Drag and Drop Functionality

### Test Basic Drag
- [ ] Select a specific category (e.g., Drinks)
- [ ] Enter edit mode
- [ ] Click and hold a product button
- [ ] Button cursor changes to 'move'
- [ ] Drag button to different grid cell
- [ ] Drop zone highlights when hovering
- [ ] Release button in new cell
- [ ] Button snaps to grid position
- [ ] Button stays in new position
- [ ] Save button becomes enabled
- [ ] "Unsaved changes" indicator appears

### Test Multiple Drags
- [ ] Drag 3-5 different buttons to new positions
- [ ] Each button moves independently
- [ ] No buttons overlap
- [ ] All buttons snap to grid cells
- [ ] Save button remains enabled
- [ ] Buttons maintain their new positions

### Test Grid Constraints
- [ ] Try dragging to different columns (1-4)
- [ ] Verify buttons only go to valid columns
- [ ] Try dragging to different rows
- [ ] Verify rows expand as needed
- [ ] Buttons cannot go outside grid

---

## TEST SUITE 4: Save Functionality

### Save Layout
- [ ] Make several position changes
- [ ] Click "Save Layout" button
- [ ] Alert appears: "Layout saved successfully!"
- [ ] Save button becomes disabled
- [ ] "Unsaved changes" indicator disappears
- [ ] User remains in edit mode
- [ ] Check Network tab: POST to `/api/layouts/till/{tillId}/category/{categoryId}`
- [ ] Response status: 201 Created
- [ ] Response contains saved layout data

### Verify Persistence - Same Session
- [ ] Click "Cancel & Exit" to exit edit mode
- [ ] Verify products are in new positions
- [ ] Click "Edit Layout" again
- [ ] Verify positions are still customized

### Verify Persistence - After Refresh
- [ ] Exit edit mode
- [ ] Refresh browser (F5)
- [ ] Login again if needed
- [ ] Navigate to same category
- [ ] Verify custom positions are loaded
- [ ] Check Network tab: GET to `/api/layouts/till/{tillId}/category/{categoryId}`
- [ ] Response contains saved positions

---

## TEST SUITE 5: Category Switching

### Customize Multiple Categories
- [ ] Switch to "Drinks" category
- [ ] Enter edit mode
- [ ] Customize layout (move 2-3 buttons)
- [ ] Save layout
- [ ] Exit edit mode
- [ ] Switch to "Food" category
- [ ] Enter edit mode
- [ ] Customize layout (move 2-3 buttons)
- [ ] Save layout
- [ ] Exit edit mode

### Verify Independent Layouts
- [ ] Switch to "Drinks" category
- [ ] Verify Drinks custom layout is shown
- [ ] Enter edit mode - positions match saved Drinks layout
- [ ] Exit edit mode
- [ ] Switch to "Food" category
- [ ] Verify Food custom layout is shown
- [ ] Enter edit mode - positions match saved Food layout
- [ ] Layouts are independent (Drinks ≠ Food)

### Test Uncustomized Category
- [ ] Switch to a category you haven't customized (e.g., "Others")
- [ ] Verify products show in default order
- [ ] Enter edit mode
- [ ] Verify can customize this category too

---

## TEST SUITE 6: Favourites and All Filters

### Test Favourites Filter Restriction
- [ ] Switch to "Favourites" tab
- [ ] Only favourite items show
- [ ] Enter edit mode
- [ ] Warning message appears
- [ ] Message says: "Edit Mode Disabled"
- [ ] Message explains: "Layout customization is only available for specific categories"
- [ ] Cannot drag buttons
- [ ] Grid overlay does NOT appear
- [ ] Save button not accessible

### Test All Filter Restriction
- [ ] Switch to "All" tab
- [ ] All products show
- [ ] Enter edit mode
- [ ] Same warning message appears
- [ ] Cannot drag buttons
- [ ] Grid overlay does NOT appear

### Return to Editable Category
- [ ] Switch to specific category (e.g., Drinks)
- [ ] Warning disappears
- [ ] Can drag buttons again
- [ ] Edit mode works normally

---

## TEST SUITE 7: Reset Functionality

### Reset Layout
- [ ] Customize a category layout
- [ ] Save it
- [ ] Enter edit mode again
- [ ] Click "Reset to Default"
- [ ] Confirmation dialog appears
- [ ] Dialog asks: "Reset layout to default?"
- [ ] Click "OK" to confirm
- [ ] All buttons return to default positions (sequential)
- [ ] Save button becomes enabled
- [ ] Alert: "Layout reset to default!"
- [ ] Check Network tab: DELETE to `/api/layouts/till/{tillId}/category/{categoryId}`

### Verify Reset Persistence
- [ ] After reset, click Save
- [ ] Exit edit mode
- [ ] Refresh page
- [ ] Verify layout is now default (not custom)

---

## TEST SUITE 8: Cancel Functionality

### Cancel with Unsaved Changes
- [ ] Enter edit mode
- [ ] Move 2-3 buttons
- [ ] DO NOT click Save
- [ ] Click "Cancel & Exit"
- [ ] Confirmation dialog appears
- [ ] Dialog asks: "You have unsaved changes. Discard changes and exit?"
- [ ] Click "Cancel" in dialog
- [ ] Remains in edit mode
- [ ] Changes are preserved
- [ ] Click "Cancel & Exit" again
- [ ] Click "OK" in dialog this time
- [ ] Exits edit mode
- [ ] Changes are discarded
- [ ] Products return to previously saved positions

### Cancel without Changes
- [ ] Enter edit mode
- [ ] DON'T make any changes
- [ ] Click "Cancel & Exit"
- [ ] NO confirmation dialog
- [ ] Exits immediately
- [ ] No changes lost (there were none)

---

## TEST SUITE 9: Error Handling

### Test Network Error During Save
- [ ] Open DevTools > Network tab
- [ ] Enter edit mode
- [ ] Move buttons
- [ ] In Network tab, enable "Offline" mode
- [ ] Click Save
- [ ] Error alert appears
- [ ] Alert shows error message
- [ ] Remains in edit mode
- [ ] Changes still in memory
- [ ] Disable "Offline" mode
- [ ] Click Save again
- [ ] Should save successfully now

### Test Network Error During Load
- [ ] Exit edit mode
- [ ] Enable "Offline" mode in Network tab
- [ ] Refresh page
- [ ] Login if needed
- [ ] Navigate to category
- [ ] Products should show in some default order
- [ ] Check console for error messages
- [ ] Disable "Offline" mode
- [ ] Refresh page
- [ ] Layouts should load correctly now

### Test Invalid Data
- [ ] This requires backend testing or API manipulation
- [ ] Optional: use Postman to send invalid data
- [ ] Verify backend validates and rejects

---

## TEST SUITE 10: Multi-User Scenarios

### Test Different Tills
- [ ] Customize layout on Till 1
- [ ] Save layout
- [ ] Logout
- [ ] Login as different user or same user
- [ ] Assign Till 2 (different till)
- [ ] Navigate to same category
- [ ] Verify layout is default (not Till 1's custom layout)
- [ ] Customize layout for Till 2
- [ ] Save layout
- [ ] Switch back to Till 1
- [ ] Verify Till 1's custom layout is still there
- [ ] Layouts are independent per till

### Test Same Till, Different Users
- [ ] User A customizes layout on Till 1
- [ ] User A saves and logs out
- [ ] User B logs in and assigns Till 1
- [ ] User B sees User A's custom layout
- [ ] Layouts are shared per till (not per user)

---

## TEST SUITE 11: Performance and Edge Cases

### Test with Many Products
- [ ] Switch to category with 20+ products
- [ ] Verify all products render
- [ ] Enter edit mode
- [ ] Drag still works smoothly
- [ ] Grid expands to accommodate products
- [ ] No lag or freezing

### Test Rapid Actions
- [ ] Enter edit mode
- [ ] Quickly drag multiple buttons
- [ ] Quickly switch categories
- [ ] Quickly save
- [ ] No crashes or errors
- [ ] Actions complete correctly

### Test Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Drag and drop works in all browsers
- [ ] Styling looks correct in all browsers

---

## TEST SUITE 12: Integration with Existing POS Features

### Test Normal POS Operations in Normal Mode
- [ ] Exit edit mode (if in it)
- [ ] Click products to add to cart
- [ ] Modify quantities in cart
- [ ] Remove items from cart
- [ ] Complete checkout
- [ ] Custom layouts don't interfere

### Test Tab Management
- [ ] Create a new tab
- [ ] Add items to tab
- [ ] Save tab
- [ ] Load tab
- [ ] Custom layouts work with tabs

### Test Table Assignment
- [ ] Assign order to a table
- [ ] Add items
- [ ] Custom layouts work with tables

### Test Different Payment Methods
- [ ] Complete order with Cash
- [ ] Complete order with Card
- [ ] Complete order with Custom method
- [ ] Custom layouts don't affect checkout

---

## TEST SUITE 13: Console and Network Monitoring

### Console Checks
- [ ] No errors in console during normal operation
- [ ] No errors when entering edit mode
- [ ] No errors when dragging buttons
- [ ] No errors when saving
- [ ] Warning messages are intentional (if any)

### Network Checks
- [ ] GET `/api/products` returns all products
- [ ] GET `/api/categories` returns all categories
- [ ] GET `/api/layouts/till/{tillId}/category/{categoryId}` returns layouts
- [ ] POST `/api/layouts/till/{tillId}/category/{categoryId}` saves layouts
- [ ] DELETE `/api/layouts/till/{tillId}/category/{categoryId}` resets layouts
- [ ] All requests return 200/201/204 status codes
- [ ] No 400/500 errors (except during error testing)

---

## TEST SUITE 14: Database Verification

### Check Database After Save
```sql
-- After saving a layout, run in PostgreSQL:
SELECT * FROM variant_layouts 
WHERE "tillId" = 1 AND "categoryId" = 1;

-- Should see records with:
-- - variantId
-- - gridColumn (1-4)
-- - gridRow (1+)
-- - createdAt
-- - updatedAt
```

### Check Database After Reset
```sql
-- After resetting a layout, run:
SELECT * FROM variant_layouts 
WHERE "tillId" = 1 AND "categoryId" = 1;

-- Should see 0 records (deleted)
```

---

## FINAL VERIFICATION

### Core Functionality
- [ ] All normal POS features work
- [ ] Edit mode only accessible to admins
- [ ] Layouts save and load correctly
- [ ] Layouts are per-till and per-category
- [ ] Drag and drop is smooth
- [ ] Grid snapping works
- [ ] All buttons functional

### Data Integrity
- [ ] No data loss on save
- [ ] No data loss on reset
- [ ] No data loss on cancel
- [ ] Layouts persist across sessions
- [ ] Layouts independent per till
- [ ] Layouts independent per category

### User Experience
- [ ] UI is intuitive
- [ ] Instructions are clear
- [ ] Feedback is immediate
- [ ] Error messages are helpful
- [ ] No confusing states
- [ ] Smooth transitions

### Performance
- [ ] No lag during drag
- [ ] No lag during save
- [ ] No lag during load
- [ ] Works with many products
- [ ] Memory usage reasonable

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No console warnings (check if warnings are expected)
- [ ] Code is maintainable
- [ ] Comments are helpful

---

## ISSUES LOG

If you find any issues during testing, document them here:

| # | Issue | Severity | Steps to Reproduce | Expected | Actual | Status |
|---|-------|----------|-------------------|----------|--------|--------|
| 1 |       | High/Med/Low |                   |          |        | Open/Fixed |
| 2 |       |          |                   |          |        |        |

---

## SIGN-OFF

- [ ] All critical tests passed
- [ ] All blocker issues resolved
- [ ] System is production-ready
- [ ] Documentation is complete

**Tested by:** _______________
**Date:** _______________
**Sign-off:** _______________