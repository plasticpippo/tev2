# Quick Layout System Test (5 Minutes)

## Prerequisites
- Backend running
- Frontend running
- Login as admin user
- Till assigned

## Quick Test Steps

### 1. Enter Edit Mode (30 seconds)
1. Click "Edit Layout" button in Order Panel
2. ✅ Edit toolbar appears
3. ✅ Grid overlay visible
4. ✅ Buttons have yellow rings

### 2. Drag a Button (30 seconds)
1. Drag a product button to new position
2. ✅ Button moves smoothly
3. ✅ Snaps to grid
4. ✅ Save button enabled

### 3. Save Layout (30 seconds)
1. Click "Save Layout"
2. ✅ Success alert appears
3. ✅ Save button becomes disabled

### 4. Verify Persistence (1 minute)
1. Exit edit mode
2. Refresh page (F5)
3. Login again
4. Navigate to same category
5. ✅ Custom layout loaded

### 5. Test Another Category (1 minute)
1. Switch to different category
2. Enter edit mode
3. Drag a button
4. Save
5. Switch back to first category
6. ✅ First category layout unchanged

### 6. Test Reset (1 minute)
1. Click "Reset to Default"
2. Confirm
3. ✅ Buttons return to default order
4. Save
5. Refresh
6. ✅ Default layout persists

### 7. Test Cancel (1 minute)
1. Enter edit mode
2. Move buttons
3. DON'T save
4. Click "Cancel & Exit"
5. ✅ Confirmation appears
6. Confirm
7. ✅ Changes discarded

## Pass Criteria
- All ✅ checkmarks completed
- No errors in console
- Layouts save and load correctly

**Result:** PASS / FAIL
**Notes:** _______________