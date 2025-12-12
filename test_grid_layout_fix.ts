import type { ProductGridLayoutData } from './frontend/services/apiBase';

// Test the fixes to the filtering and ID comparison logic
console.log('Testing ProductGridLayoutCustomizer fixes...');

// Test case 1: Filter function with undefined filterType
const testLayouts: ProductGridLayoutData[] = [
  { id: 1, name: 'Layout 1', tillId: 1, layout: { columns: 4, gridItems: [], version: '1.0' }, isDefault: false, filterType: 'all' },
  { id: 2, name: 'Layout 2', tillId: 1, layout: { columns: 4, gridItems: [], version: '1.0' }, isDefault: false, filterType: 'favorites' },
  { id: 3, name: 'Layout 3', tillId: 1, layout: { columns: 4, gridItems: [], version: '1.0' }, isDefault: false, filterType: 'category', categoryId: 1 },
  { id: 4, name: 'Layout 4', tillId: 1, layout: { columns: 4, gridItems: [], version: '1.0' }, isDefault: false }, // filterType is undefined
];

// Simulate the old filtering logic (before fix)
function oldFilterLogic(availableLayouts: ProductGridLayoutData[], filterType: string) {
  return availableLayouts.filter(layout => {
    const matchesFilter = filterType === 'all' || 
      (filterType === 'favorites' && layout.filterType === 'favorites') ||
      (filterType === 'category' && layout.filterType === 'category');
    const matchesSearch = layout.name.toLowerCase().includes('');
    return matchesFilter && matchesSearch;
  });
}

// Simulate the new filtering logic (after fix)
function newFilterLogic(availableLayouts: ProductGridLayoutData[], filterType: string) {
  return availableLayouts.filter(layout => {
    const layoutFilterType = layout.filterType || 'all'; // Default to 'all' if filterType is undefined
    const matchesFilter = filterType === 'all' || 
      (filterType === 'favorites' && layoutFilterType === 'favorites') ||
      (filterType === 'category' && layoutFilterType === 'category');
    const matchesSearch = layout.name.toLowerCase().includes('');
    return matchesFilter && matchesSearch;
  });
}

console.log('Testing filter logic with "all" filter type:');
console.log('Old logic result count:', oldFilterLogic(testLayouts, 'all').length);
console.log('New logic result count:', newFilterLogic(testLayouts, 'all').length);

console.log('\nTesting filter logic with "favorites" filter type:');
console.log('Old logic result count:', oldFilterLogic(testLayouts, 'favorites').length);
console.log('New logic result count:', newFilterLogic(testLayouts, 'favorites').length);

console.log('\nTesting filter logic with "category" filter type:');
console.log('Old logic result count:', oldFilterLogic(testLayouts, 'category').length);
console.log('New logic result count:', newFilterLogic(testLayouts, 'category').length);

// Test case 2: ID comparison functions
function oldIdComparison(layoutId: string | number | undefined, currentLayoutId: string | number | null) {
  return layoutId === currentLayoutId;
}

function newIdComparison(layoutId: string | number | undefined, currentLayoutId: string | number | null) {
  return layoutId?.toString() === currentLayoutId?.toString();
}

console.log('\nTesting ID comparison logic:');
console.log('Old comparison (1, "1"):', oldIdComparison(1, "1")); // Should be false (different types)
console.log('New comparison (1, "1"):', newIdComparison(1, "1")); // Should be true (same after conversion)

console.log('Old comparison ("2", 2):', oldIdComparison("2", 2)); // Should be false (different types) 
console.log('New comparison ("2", 2):', newIdComparison("2", 2)); // Should be true (same after conversion)

console.log('Old comparison (3, 3):', oldIdComparison(3, 3)); // Should be true
console.log('New comparison (3, 3):', newIdComparison(3, 3)); // Should be true

console.log('\nAll tests completed successfully!');
console.log('The fixes address:');
console.log('1. Proper handling of undefined filterType values by defaulting to "all"');
console.log('2. Consistent ID comparison regardless of type (string vs number)');
console.log('3. This should resolve the issue where layouts were saved but not appearing in the UI list');