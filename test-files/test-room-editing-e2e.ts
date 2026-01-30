/**
 * End-to-end test for room editing functionality in the POS system
 * This test verifies the ability to edit existing room names using Playwright
 */

import { test, expect } from '@playwright/test';

// Test to verify the ability to edit existing room names in the POS system
test.describe('Room Editing Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the POS system login page
    await page.goto('http://192.168.1.241:3000');
    
    // Login with admin credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and navigate to table management
    await page.waitForURL('http://192.168.1.241:3000/**');
    
    // Navigate to the table management section
    await page.locator('text=Admin Panel').click();
    await page.locator('text=Table Management').click();
  });

  test('should successfully edit an existing room name', async ({ page }) => {
    // Switch to the rooms tab
    await page.locator('button:has-text("Rooms")').click();
    
    // Create a test room first if it doesn't exist
    const roomExists = await page.locator('text=Test Room for Editing').isVisible();
    if (!roomExists) {
      await page.locator('button:has-text("Add Room")').click();
      await page.fill('input[type="text"]', 'Test Room for Editing');
      await page.fill('textarea', 'Original description');
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(1000); // Wait for room to be created
    }
    
    // Find the room and click the edit button
    await page.locator('button:has-text("Edit")').first().click();
    
    // Modify the room name
    await page.fill('input[type="text"]', 'Updated Room Name');
    await page.fill('textarea', 'Updated description');
    
    // Save the changes
    await page.locator('button:has-text("Save")').click();
    
    // Verify the room name was updated
    await page.waitForTimeout(1000); // Wait for update to complete
    await expect(page.locator('text=Updated Room Name')).toBeVisible();
  });

  test('should validate room name during editing', async ({ page }) => {
    // Switch to the rooms tab
    await page.locator('button:has-text("Rooms")').click();
    
    // Create a test room first if it doesn't exist
    const roomExists = await page.locator('text=Validation Test Room').isVisible();
    if (!roomExists) {
      await page.locator('button:has-text("Add Room")').click();
      await page.fill('input[type="text"]', 'Validation Test Room');
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(1000); // Wait for room to be created
    }
    
    // Find the room and click the edit button
    await page.locator('button:has-text("Edit")').first().click();
    
    // Try to enter an invalid room name (empty)
    await page.fill('input[type="text"]', '');
    
    // Try to save (this should show an error)
    await page.locator('button:has-text("Save")').click();
    
    // Verify error message appears
    await expect(page.locator('text=Room name is required')).toBeVisible();
  });

  test('should preserve other room properties when editing name only', async ({ page }) => {
    // Switch to the rooms tab
    await page.locator('button:has-text("Rooms")').click();
    
    // Create a test room first if it doesn't exist
    const roomExists = await page.locator('text=Property Preservation Room').isVisible();
    if (!roomExists) {
      await page.locator('button:has-text("Add Room")').click();
      await page.fill('input[type="text"]', 'Property Preservation Room');
      await page.fill('textarea', 'Original description for preservation test');
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(1000); // Wait for room to be created
    }
    
    // Note the original description
    const originalDescription = await page.locator('text=Original description for preservation test').textContent();
    expect(originalDescription).toContain('Original description for preservation test');
    
    // Find the room and click the edit button
    await page.locator('button:has-text("Edit")').first().click();
    
    // Change only the room name, leave description unchanged
    await page.fill('input[type="text"]', 'Updated Property Preservation Room');
    // Don't change the description field
    
    // Save the changes
    await page.locator('button:has-text("Save")').click();
    
    // Verify both the name was updated and description remained the same
    await page.waitForTimeout(1000); // Wait for update to complete
    await expect(page.locator('text=Updated Property Preservation Room')).toBeVisible();
    await expect(page.locator('text=Original description for preservation test')).toBeVisible();
  });

  test('should handle special characters in room names during editing', async ({ page }) => {
    // Switch to the rooms tab
    await page.locator('button:has-text("Rooms")').click();
    
    // Create a test room first if it doesn't exist
    const roomExists = await page.locator('text=Special Chars Room').isVisible();
    if (!roomExists) {
      await page.locator('button:has-text("Add Room")').click();
      await page.fill('input[type="text"]', 'Special Chars Room');
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(1000); // Wait for room to be created
    }
    
    // Find the room and click the edit button
    await page.locator('button:has-text("Edit")').first().click();
    
    // Enter a room name with special characters that should be allowed
    await page.fill('input[type="text"]', 'Room with Spaces, Hyphens-Underscores_SpecialChars(test)');
    
    // Save the changes
    await page.locator('button:has-text("Save")').click();
    
    // Verify the room name with special characters was saved
    await page.waitForTimeout(1000); // Wait for update to complete
    await expect(page.locator('text=Room with Spaces, Hyphens-Underscores_SpecialChars(test)')).toBeVisible();
  });
});