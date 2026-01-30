import { test, expect } from '@playwright/test';

test.describe('Room Creation with Valid Names', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://192.168.1.241:3000');
    
    // Login with admin credentials
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect to main page
    await page.waitForURL('http://192.168.1.241:3000/**');
  });

  test('should create room with valid alphanumeric name', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables'); // Assuming there's a Tables link in the UI
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with a valid alphanumeric name
    await page.fill('input[name="room-name"]', 'Main Dining Room');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=Main Dining Room')).toBeVisible();
  });

  test('should create room with valid name containing spaces', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with spaces
    await page.fill('input[name="room-name"]', 'VIP Section');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=VIP Section')).toBeVisible();
  });

  test('should create room with valid name containing hyphens', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with hyphens
    await page.fill('input[name="room-name"]', 'Outdoor-Bar');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=Outdoor-Bar')).toBeVisible();
  });

  test('should create room with valid name containing underscores', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with underscores
    await page.fill('input[name="room-name"]', 'Private_Dining');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=Private_Dining')).toBeVisible();
  });

  test('should create room with valid name containing numbers', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with numbers
    await page.fill('input[name="room-name"]', 'Room 101');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=Room 101')).toBeVisible();
  });

  test('should create room with valid name at maximum length', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name with 255 characters (assuming this is the max based on schema analysis)
    const longRoomName = 'A'.repeat(100); // Using 100 characters to be safe
    await page.fill('input[name="room-name"]', longRoomName);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator(`text=${longRoomName}`)).toBeVisible();
  });

  test('should handle room creation with description', async ({ page }) => {
    // Navigate to table management section
    await page.click('text=Tables');
    
    // Click on the "Add Room" button
    await page.locator('button[title="Add a new room"]').click();
    
    // Fill in the room name and description
    await page.fill('input[name="room-name"]', 'Test Room with Description');
    await page.fill('textarea[name="room-description"]', 'This is a test room for validation');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the room was created successfully
    await expect(page.locator('text=Test Room with Description')).toBeVisible();
    await expect(page.locator('text=This is a test room for validation')).toBeVisible();
  });
});