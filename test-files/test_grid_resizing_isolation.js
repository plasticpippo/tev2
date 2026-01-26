/**
 * Test script to validate that grid item resizing works in isolation
 * This script tests the core logic without UI rendering
 */

// Mock implementation of the grid item update logic
function updateGridItem(gridItems, itemId, updates) {
  return gridItems.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
}

// Test data representing grid items
const initialGridItems = [
  {
    id: 'item-1',
    name: 'Coffee',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  },
  {
    id: 'item-2',
    name: 'Tea',
    x: 2,
    y: 1,
    width: 1,
    height: 1,
  },
  {
    id: 'item-3',
    name: 'Cake',
    x: 4,
    y: 0,
    width: 2,
    height: 1,
  }
];

console.log('Initial grid items:');
console.table(initialGridItems);

// Test 1: Resize item-1
console.log('\n--- Test 1: Resizing item-1 ---');
const updatedGridItems1 = updateGridItem(initialGridItems, 'item-1', {
  width: 2,
  height: 2
});

console.log('After resizing item-1 to width: 2, height: 2');
console.table(updatedGridItems1);

// Verify that only item-1 was affected
const item1AfterUpdate = updatedGridItems1.find(item => item.id === 'item-1');
const item2AfterUpdate = updatedGridItems1.find(item => item.id === 'item-2');
const item3AfterUpdate = updatedGridItems1.find(item => item.id === 'item-3');

console.log('\nVerification:');
console.log(`item-1 width: ${item1AfterUpdate.width} (should be 2)`);
console.log(`item-1 height: ${item1AfterUpdate.height} (should be 2)`);
console.log(`item-2 width: ${item2AfterUpdate.width} (should still be 1)`);
console.log(`item-2 height: ${item2AfterUpdate.height} (should still be 1)`);
console.log(`item-3 width: ${item3AfterUpdate.width} (should still be 2)`);
console.log(`item-3 height: ${item3AfterUpdate.height} (should still be 1)`);

// Test 2: Resize item-2
console.log('\n--- Test 2: Resizing item-2 ---');
const updatedGridItems2 = updateGridItem(updatedGridItems1, 'item-2', {
  width: 3,
  height: 1
});

console.log('After resizing item-2 to width: 3, height: 1');
console.table(updatedGridItems2);

// Verify that only item-2 was affected
const item1AfterSecondUpdate = updatedGridItems2.find(item => item.id === 'item-1');
const item2AfterSecondUpdate = updatedGridItems2.find(item => item.id === 'item-2');
const item3AfterSecondUpdate = updatedGridItems2.find(item => item.id === 'item-3');

console.log('\nVerification after second update:');
console.log(`item-1 width: ${item1AfterSecondUpdate.width} (should still be 2)`);
console.log(`item-1 height: ${item1AfterSecondUpdate.height} (should still be 2)`);
console.log(`item-2 width: ${item2AfterSecondUpdate.width} (should now be 3)`);
console.log(`item-2 height: ${item2AfterSecondUpdate.height} (should still be 1)`);
console.log(`item-3 width: ${item3AfterSecondUpdate.width} (should still be 2)`);
console.log(`item-3 height: ${item3AfterSecondUpdate.height} (should still be 1)`);

// Final verification
const allTestsPassed = 
  item1AfterUpdate.width === 2 &&
  item1AfterUpdate.height === 2 &&
  item2AfterUpdate.width === 1 &&
  item2AfterUpdate.height === 1 &&
  item3AfterUpdate.width === 2 &&
  item3AfterUpdate.height === 1 &&
  item1AfterSecondUpdate.width === 2 &&
  item1AfterSecondUpdate.height === 2 &&
  item2AfterSecondUpdate.width === 3 &&
  item2AfterSecondUpdate.height === 1 &&
  item3AfterSecondUpdate.width === 2 &&
  item3AfterSecondUpdate.height === 1;

console.log('\n=== FINAL RESULT ===');
console.log(`All tests passed: ${allTestsPassed}`);
if (allTestsPassed) {
  console.log('✅ Grid item resizing works in isolation as expected!');
} else {
  console.log('❌ There are issues with grid item isolation');
}

// Additional test: Ensure position updates work independently
console.log('\n--- Test 3: Moving item-3 position ---');
const updatedGridItems3 = updateGridItem(updatedGridItems2, 'item-3', {
  x: 1,
  y: 3
});

console.log('After moving item-3 to position (1, 3)');
const item3AfterMove = updatedGridItems3.find(item => item.id === 'item-3');
const item1AfterMove = updatedGridItems3.find(item => item.id === 'item-1');
const item2AfterMove = updatedGridItems3.find(item => item.id === 'item-2');

console.log(`item-3 position: (${item3AfterMove.x}, ${item3AfterMove.y}) (should be 1, 3)`);
console.log(`item-1 position: (${item1AfterMove.x}, ${item1AfterMove.y}) (should still be 0, 0)`);
console.log(`item-2 position: (${item2AfterMove.x}, ${item2AfterMove.y}) (should still be 2, 1)`);

console.log(`item-3 dimensions: ${item3AfterMove.width}x${item3AfterMove.height} (should still be 2x1)`);
console.log(`item-1 dimensions: ${item1AfterMove.width}x${item1AfterMove.height} (should still be 2x2)`);
console.log(`item-2 dimensions: ${item2AfterMove.width}x${item2AfterMove.height} (should still be 3x1)`);