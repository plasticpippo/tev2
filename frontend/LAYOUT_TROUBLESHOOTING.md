# Layout System Troubleshooting Guide

## Issue: Edit Layout button not visible

### Possible Causes
1. User is not admin
2. Till not assigned
3. LayoutProvider not wrapping component
4. Component not within LayoutProvider scope

### Solutions
1. Check `currentUser.role === 'admin'`
2. Check `assignedTillId !== null`
3. Verify `<LayoutProvider>` wraps MainPOSInterface
4. Check console for "useLayout must be used within LayoutProvider"

### Verification
```typescript
console.log('User:', currentUser);
console.log('Role:', currentUser?.role);
console.log('Till ID:', assignedTillId);
```

---

## Issue: Cannot drag buttons

### Possible Causes
1. Not in edit mode
2. On Favourites or All filter
3. Browser doesn't support drag API
4. JavaScript error blocking interaction

### Solutions
1. Click "Edit Layout" button first
2. Switch to specific category (Drinks, Food, etc.)
3. Try different browser
4. Check console for errors

### Verification
```typescript
const { isEditMode, currentCategoryId } = useLayout();
console.log('Edit mode:', isEditMode);
console.log('Category:', currentCategoryId);
// currentCategoryId should be a number, not 'favourites' or 'all'
```

---

## Issue: Layout not saving

### Possible Causes
1. Network error
2. Backend not running
3. Invalid data
4. Database error
5. Validation error

### Solutions
1. Check Network tab for failed requests
2. Verify backend is running on port 3001
3. Check request payload in Network tab
4. Check backend console for errors
5. Verify tillId and categoryId are valid

### Verification
```bash
# Test backend API directly
curl http://192.168.1.241:3001/api/health

# Test save endpoint
curl -X POST http://192.168.1.241:3001/api/layouts/till/1/category/1 \
  -H "Content-Type: application/json" \
  -d '{"positions":[{"variantId":1,"gridColumn":1,"gridRow":1}]}'
```

---

## Issue: Layout not loading after refresh

### Possible Causes
1. Save didn't actually work
2. Loading from wrong till/category
3. Database connection issue
4. API route not configured

### Solutions
1. Verify save success in Network tab
2. Check tillId and categoryId match
3. Check database for saved records
4. Verify routes registered in router.ts

### Verification
```sql
-- Check database directly
SELECT * FROM variant_layouts 
WHERE "tillId" = 1 AND "categoryId" = 1;
```

---

## Issue: Products not displaying

### Possible Causes
1. No products in database
2. Category filter excluding products
3. Component not receiving props
4. API not returning products

### Solutions
1. Verify products exist in database
2. Try switching to "All" category
3. Check props in React DevTools
4. Check Network tab for `/api/products` response

### Verification
```typescript
console.log('Products:', products);
console.log('Products count:', products.length);
console.log('Items to render:', itemsToRender.length);
```

---

## Issue: Grid not showing

### Possible Causes
1. Not in edit mode
2. On non-numbered category (favourites/all)
3. CSS issue
4. Component not rendering overlay

### Solutions
1. Enter edit mode
2. Switch to numbered category
3. Check browser inspector for grid overlay element
4. Verify `showEditGrid` is true

### Verification
```typescript
const showEditGrid = isEditMode && typeof currentCategoryId === 'number';
console.log('Show edit grid:', showEditGrid);
console.log('Is edit mode:', isEditMode);
console.log('Category ID type:', typeof currentCategoryId);
```

---

## Issue: TypeScript errors

### Possible Causes
1. Missing type definitions
2. Incorrect imports
3. Props mismatch
4. Version incompatibility

### Solutions
1. Run `npm install` to ensure all dependencies installed
2. Check import paths are correct
3. Verify prop types match interfaces
4. Check TypeScript version compatibility

### Verification
```bash
# Check TypeScript compilation
cd frontend
npx tsc --noEmit

# Should show specific errors if any
```

---

## Issue: Buttons overlap after drag

### Possible Causes
1. Multiple buttons same position
2. Grid positioning bug
3. State not updating correctly

### Solutions
1. Reset layout to default
2. Refresh page
3. Check console for state update errors
4. File bug report with reproduction steps

### Verification
```typescript
const categoryLayout = getCurrentCategoryLayout();
console.log('Positions:', categoryLayout?.positions);
// Check for duplicate variantId in positions array
```

---

## Issue: Changes not appearing in edit mode

### Possible Causes
1. State not updating
2. Component not re-rendering
3. Position update not called
4. Layout context not connected

### Solutions
1. Check React DevTools for state changes
2. Add console.log in updateButtonPosition
3. Verify drag handlers are firing
4. Check LayoutProvider is wrapping component

### Verification
```typescript
const handleDrop = (e, col, row) => {
  console.log('Drop event fired:', { col, row });
  const variantId = e.dataTransfer.getData('variantId');
  console.log('Variant ID:', variantId);
  updateButtonPosition(Number(variantId), col, row);
  console.log('Position updated');
};
```

---

## Issue: Performance lag when dragging

### Possible Causes
1. Too many products
2. Heavy re-renders
3. Unoptimized images
4. Memory leak

### Solutions
1. Use React.memo on DraggableProductButton
2. Optimize useMemo dependencies
3. Reduce product count or use pagination
4. Check for memory leaks in DevTools

### Verification
```bash
# Open Chrome DevTools
# Performance tab > Record
# Drag buttons while recording
# Stop and analyze frame rate
# Should be 60fps or close
```

---

## Database Issues

### Cannot connect to database
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Tables not created
```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Verify tables exist
npx prisma studio
# Opens UI to browse database
```

### Data not saving
```bash
# Check table permissions
# Connect to database
\dp variant_layouts

# Should show insert/update/delete permissions
```

---

## Getting Help

If you can't resolve an issue:

1. **Check console** for error messages
2. **Check Network tab** for failed requests
3. **Check backend logs** for server errors
4. **Check database** for data integrity
5. **Document the issue** with reproduction steps
6. **Search for similar issues** in TypeScript/React/Prisma docs
7. **Ask for help** with clear description and error messages

## Reporting Bugs

When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/videos
- Console errors
- Network request/response
- Browser and version
- Operating system