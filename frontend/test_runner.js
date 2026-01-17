#!/usr/bin/env node

/**
 * Test Runner for Comprehensive Grid Layout Customization Tests
 * This script runs the Playwright tests for the enhanced grid layout functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Check if Playwright is installed
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (!pkg.devDependencies || !pkg.devDependencies['@playwright/test']) {
    console.error('ERROR: @playwright/test is not installed as a dev dependency');
    console.error('Run: npm install -D @playwright/test');
    process.exit(1);
  }
} catch (e) {
  console.error('ERROR: Could not read package.json or @playwright/test is not installed');
  process.exit(1);
}

console.log('🚀 Starting Comprehensive Grid Layout Customization Tests...\n');

// Install Playwright browsers if not already installed
try {
  console.log('📦 Installing Playwright browsers...');
  execSync('npx playwright install --with-deps', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed successfully\n');
} catch (error) {
  console.error('⚠️  Failed to install Playwright browsers. They might already be installed.\n');
}

// Run the tests
try {
  console.log('🧪 Running comprehensive grid layout tests...\n');
  execSync('npx playwright test playwright_comprehensive_grid_tests.ts --project=chromium', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Some tests failed. Please check the output above.');
  process.exit(1);
}