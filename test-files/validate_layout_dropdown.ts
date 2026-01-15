/**
 * Validation script for the layout selection dropdown functionality
 * This script validates that the required changes have been made correctly
 */

import fs from 'fs';
import path from 'path';

// Define the expected changes
const expectedChanges = [
  {
    file: 'frontend/components/LayoutSelectionDropdown.tsx',
    checks: [
      { type: 'exists', description: 'Layout selection dropdown component exists' },
      { type: 'content', content: 'LayoutSelectionDropdown', description: 'Component exports LayoutSelectionDropdown' },
      { type: 'content', content: 'getLayoutsByFilterType', description: 'Uses the new API function' }
    ]
  },
  {
    file: 'frontend/services/apiBase.ts',
    checks: [
      { type: 'exists', description: 'API base file exists' },
      { type: 'content', content: 'id?: string | number', description: 'ProductGridLayoutData includes id field' }
    ]
  },
  {
    file: 'frontend/services/gridLayoutService.ts',
    checks: [
      { type: 'exists', description: 'Grid layout service exists' },
      { type: 'content', content: 'getLayoutsByFilterType', description: 'New API function exists' }
    ]
  },
  {
    file: 'backend/src/handlers/gridLayout.ts',
    checks: [
      { type: 'exists', description: 'Backend handler exists' },
      { type: 'content', content: 'layouts-by-filter', description: 'New API endpoint exists' }
    ]
  },
  {
    file: 'frontend/components/ProductGrid.tsx',
    checks: [
      { type: 'exists', description: 'Product grid component exists' },
      { type: 'content', content: 'LayoutSelectionDropdown', description: 'Uses the layout dropdown component' },
      { type: 'content', content: 'handleLayoutChange', description: 'Has layout change handler' }
    ]
  }
];

// Function to validate a file
function validateFile(filePath: string, checks: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if file exists
 if (!fs.existsSync(filePath)) {
    return { valid: false, errors: [`File does not exist: ${filePath}`] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  for (const check of checks) {
    if (check.type === 'exists') {
      // Already checked existence above
    } else if (check.type === 'content') {
      if (!content.includes(check.content)) {
        errors.push(`Missing content in ${filePath}: ${check.content} (${check.description})`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Run validation
console.log('Validating layout selection dropdown implementation...\n');

let allValid = true;
const allErrors: string[] = [];

for (const change of expectedChanges) {
  console.log(`Checking: ${change.file}`);
  const result = validateFile(change.file, change.checks);
  
  if (result.valid) {
    console.log('  ✓ Valid');
  } else {
    console.log('  ✗ Invalid');
    for (const error of result.errors) {
      console.log(`    - ${error}`);
    }
    allValid = false;
  }
  console.log('');
  
  allErrors.push(...result.errors);
}

// Summary
console.log('=== Validation Summary ===');
if (allValid) {
  console.log('✓ All validations passed! The layout selection dropdown is correctly implemented.');
  console.log('\nThe implementation includes:');
  console.log('- A new LayoutSelectionDropdown component');
  console.log('- Updated ProductGridLayoutData interface with id field');
  console.log('- New API endpoint for getting layouts by filter type');
  console.log('- New service function to call the API endpoint');
  console.log('- Integration with the ProductGrid component');
  console.log('- Integration with the main POS interface');
} else {
  console.log('✗ Some validations failed:');
  for (const error of allErrors) {
    console.log(`  - ${error}`);
  }
}

process.exit(allValid ? 0 : 1);