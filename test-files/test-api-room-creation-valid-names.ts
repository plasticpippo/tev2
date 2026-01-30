/**
 * Playwright Test: API Room Creation with Valid Names
 * 
 * This test verifies that room creation works correctly with various valid room name formats
 * using the Playwright MCP server for browser automation.
 */

// Import required modules
import { test, expect } from '@playwright/test';

// Test suite for room creation with valid names
test.describe('API Room Creation with Valid Names', () => {
  // Base URL for the application
  const BASE_URL = 'http://192.168.1.241:3000';
  
  // Admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  // Valid room names to test
  const VALID_ROOM_NAMES = [
    'Simple Room',
    'Room With Spaces',
    'Room123',
    'Special-Chars_Room',
    'Test Room',
    'Test-Room',
    'Room_With_Underscore',
    'Room123Test',
    'Test Room 2026',
    'AlphaBetaGamma'
  ];

  /**
   * Test that various valid room names can be created successfully
   */
  test('should successfully create rooms with various valid names', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login credentials
    await page.fill('#username', ADMIN_CREDENTIALS.username);
    await page.fill('#password', ADMIN_CREDENTIALS.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to main page
    await page.waitForURL(`${BASE_URL}/**`);
    
    // Test each valid room name
    for (const roomName of VALID_ROOM_NAMES) {
      console.log(`Testing room creation with name: ${roomName}`);
      
      // Navigate to room creation page
      await page.goto(`${BASE_URL}/rooms/create`);
      
      // Fill room details
      await page.fill('#room-name', roomName);
      await page.fill('#room-description', `Test room for ${roomName}`);
      
      // Submit the form
      await page.click('#create-room-btn');
      
      // Wait for success response
      await page.waitForSelector('.success-message', { timeout: 5000 });
      
      // Verify room appears in the list
      await expect(page.locator(`text=${roomName}`)).toBeVisible();
    }
  });

  /**
   * Test minimal valid room name
   */
  test('should successfully create room with minimal valid name', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#username', ADMIN_CREDENTIALS.username);
    await page.fill('#password', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/**`);
    
    // Navigate to room creation
    await page.goto(`${BASE_URL}/rooms/create`);
    
    // Fill minimal room name
    const minimalName = 'A';
    await page.fill('#room-name', minimalName);
    await page.fill('#room-description', 'Minimal room name test');
    
    // Submit the form
    await page.click('#create-room-btn');
    
    // Wait for success
    await page.waitForSelector('.success-message', { timeout: 5000 });
    
    // Verify room was created
    await expect(page.locator(`text=${minimalName}`)).toBeVisible();
  });

  /**
   * Test maximum length valid room name
   */
  test('should successfully create room with maximum length valid name', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#username', ADMIN_CREDENTIALS.username);
    await page.fill('#password', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/**`);
    
    // Navigate to room creation
    await page.goto(`${BASE_URL}/rooms/create`);
    
    // Fill maximum length room name
    const maxLengthName = 'A'.repeat(100); // 100 characters
    await page.fill('#room-name', maxLengthName);
    await page.fill('#room-description', 'Maximum length room name test');
    
    // Submit the form
    await page.click('#create-room-btn');
    
    // Wait for success
    await page.waitForSelector('.success-message', { timeout: 5000 });
    
    // Verify room was created
    await expect(page.locator(`text=${maxLengthName}`)).toBeVisible();
  });

  /**
   * Test special character combinations in room names
   */
  test('should successfully create rooms with special character combinations', async ({ page }) => {
    const specialNames = [
      'Room-With-Dashes',
      'Room_With_Underscores',
      'Room.With.Dots',
      'Room With Spaces',
      'Room123Mixed456',
      'Room-with-all_special.chars123'
    ];
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#username', ADMIN_CREDENTIALS.username);
    await page.fill('#password', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/**`);
    
    for (const roomName of specialNames) {
      // Navigate to room creation
      await page.goto(`${BASE_URL}/rooms/create`);
      
      // Fill room details
      await page.fill('#room-name', roomName);
      await page.fill('#room-description', `Special character test: ${roomName}`);
      
      // Submit the form
      await page.click('#create-room-btn');
      
      // Wait for success
      await page.waitForSelector('.success-message', { timeout: 5000 });
      
      // Verify room was created
      await expect(page.locator(`text=${roomName}`)).toBeVisible();
    }
  });
});

/**
 * How to run this test with Playwright MCP Server:
 * 
 * 1. Make sure the application is running at http://192.168.1.241:3000
 * 2. Start the Playwright MCP server
 * 3. Execute the test using the Playwright runner
 * 
 * The test covers:
 * - Various valid room name formats
 * - Minimal and maximum length names
 * - Special character combinations
 * - Successful creation verification
 */