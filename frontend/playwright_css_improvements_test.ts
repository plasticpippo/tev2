// Comprehensive CSS Testing for MainPOSInterface Component using Playwright MCP
import { mcp_playwright_browser_navigate, mcp_playwright_browser_snapshot, mcp_playwright_browser_click, mcp_playwright_browser_fill_form, mcp_playwright_browser_wait_for, mcp_playwright_browser_verify_element_visible, mcp_playwright_browser_verify_text_visible, mcp_playwright_browser_resize, mcp_playwright_browser_evaluate, mcp_playwright_browser_take_screenshot } from './playwright_functions';

async function runCSSTesting() {
  console.log('Starting comprehensive CSS improvements testing...');
  
  // Navigate to the POS interface
  await mcp_playwright_browser_navigate({ url: 'http://192.168.1.241:3000' });
  await mcp_playwright_browser_wait_for({ time: 3 });
  
  // Take initial snapshot
  const initialSnapshot = await mcp_playwright_browser_snapshot();
  console.log('Initial page loaded:', initialSnapshot.length, 'characters');
  
  // Try to log in as admin to access the POS interface
  // First, check if we're on the login page
  if (initialSnapshot.includes('Login')) {
    // Fill in login form
    await mcp_playwright_browser_fill_form({
      fields: [
        {
          name: "username",
          type: "textbox",
          ref: findElementRef(initialSnapshot, 'input', 'username'),
          value: "admin"
        },
        {
          name: "password", 
          type: "textbox",
          ref: findElementRef(initialSnapshot, 'input', 'password'),
          value: "admin123"
        }
      ]
    });
    
    // Click login button
    const loginButtonRef = findElementRef(initialSnapshot, 'button', 'login');
    await mcp_playwright_browser_click({
      element: "Login button",
      ref: loginButtonRef
    });
    
    // Wait for login to complete
    await mcp_playwright_browser_wait_for({ time: 5 });
  }
  
  // Take snapshot of POS interface
  const posSnapshot = await mcp_playwright_browser_snapshot();
  await mcp_playwright_browser_take_screenshot({ filename: 'main-pos-interface.png' });
  
  console.log('Testing CSS variables application...');
  
  // Verify CSS variables are applied correctly by checking computed styles
  const backgroundColorResult = await mcp_playwright_browser_evaluate({
    function: "() => { return getComputedStyle(document.querySelector('.w-screen.h-screen')).backgroundColor; }"
  });
  
  console.log('Background color from CSS variables:', backgroundColorResult);
  
  // Verify that the background color matches our CSS variable (--bg-primary: #1e293b)
  if (typeof backgroundColorResult === 'string' && backgroundColorResult.includes('30, 41, 59')) {
    console.log('✓ CSS variables for background color are applied correctly');
  } else {
    console.log('✗ CSS variables for background color are NOT applied correctly');
  }
  
  console.log('Testing z-index behavior for admin panel button...');
  
  // Check z-index of admin panel button
  const zIndexResult = await mcp_playwright_browser_evaluate({
    function: "() => { const button = document.querySelector('button'); return button ? getComputedStyle(button).zIndex : 'not found'; }"
  });
  
  console.log('Admin panel button z-index:', zIndexResult);
  
  // Verify that the z-index is 30 (from --z-fixed: 30)
  if (zIndexResult === '30') {
    console.log('✓ Z-index behavior for admin panel button is correct');
  } else {
    console.log('✗ Z-index behavior for admin panel button is incorrect, expected 30, got:', zIndexResult);
  }
  
  console.log('Testing responsive grid layout (w-2/3, w-1/3)...');
  
  // Check the dimensions of the two main layout sections
  const layoutDimensions = await mcp_playwright_browser_evaluate({
    function: "() => { " +
      "const container = document.querySelector('.w-screen.h-screen'); " +
      "const productGrid = document.querySelector('div.w-2\\\\/3'); " +
      "const orderPanel = document.querySelector('div.w-1\\\\/3'); " +
      "return { " +
        "containerWidth: container ? container.getBoundingClientRect().width : 0, " +
        "productGridWidth: productGrid ? productGrid.getBoundingClientRect().width : 0, " +
        "orderPanelWidth: orderPanel ? orderPanel.getBoundingClientRect().width : 0 " +
      "}; " +
    "}"
  });
  
  console.log('Layout dimensions:', layoutDimensions);
  
  // Verify that the layout roughly follows the 2/3 and 1/3 split
  if (layoutDimensions.containerWidth > 0) {
    const expectedProductGridWidth = layoutDimensions.containerWidth * 0.666;
    const expectedOrderPanelWidth = layoutDimensions.containerWidth * 0.333;
    
    const productGridRatio = layoutDimensions.productGridWidth / expectedProductGridWidth;
    const orderPanelRatio = layoutDimensions.orderPanelWidth / expectedOrderPanelWidth;
    
    // Allow for some tolerance due to padding, borders, etc.
    if (productGridRatio > 0.8 && productGridRatio < 1.2) {
      console.log('✓ Product grid width (w-2/3) is approximately correct');
    } else {
      console.log('✗ Product grid width (w-2/3) is not correct, ratio:', productGridRatio);
    }
    
    if (orderPanelRatio > 0.8 && orderPanelRatio < 1.2) {
      console.log('✓ Order panel width (w-1/3) is approximately correct');
    } else {
      console.log('✗ Order panel width (w-1/3) is not correct, ratio:', orderPanelRatio);
    }
  } else {
    console.log('✗ Could not determine layout dimensions');
  }
  
  console.log('Testing color consistency with semantic variables...');
  
  // Check that accent colors are consistent with CSS variables
  const accentColorResult = await mcp_playwright_browser_evaluate({
    function: "() => { " +
      "const button = document.querySelector('button.bg-amber-500, button.bg-purple-700'); " +
      "return button ? getComputedStyle(button).backgroundColor : 'not found'; " +
    "}"
  });
  
  console.log('Accent button color:', accentColorResult);
  
  // This should match --accent-primary: #f59e0b or similar
  if (typeof accentColorResult === 'string' && 
      (accentColorResult.includes('245, 158, 11') || accentColorResult.includes('126, 34, 206'))) {
    console.log('✓ Color consistency with semantic variables is maintained');
  } else {
    console.log('✗ Color consistency with semantic variables may not be maintained');
  }
  
  console.log('Testing button states for admin panel button...');
  
  // Find and interact with admin panel button
  const adminButtonExists = await mcp_playwright_browser_evaluate({
    function: "() => { return document.querySelector('button:contains(\"Admin Panel\")') !== null; }"
  });
  
  if (adminButtonExists) {
    console.log('✓ Admin panel button is visible');
    
    // Test click functionality
    const adminButtonRef = findElementRef(posSnapshot, 'button', 'Admin Panel');
    if (adminButtonRef) {
      await mcp_playwright_browser_click({
        element: "Admin Panel button",
        ref: adminButtonRef
      });
      
      await mcp_playwright_browser_wait_for({ time: 2 });
      
      // Check if admin panel opened
      const adminPanelOpened = await mcp_playwright_browser_evaluate({
        function: "() => { return document.querySelector('[data-testid=\"admin-panel\"], .admin-panel, div.admin') !== null; }"
      });
      
      if (adminPanelOpened) {
        console.log('✓ Admin panel button click functionality works');
      } else {
        console.log('✗ Admin panel button click functionality does not work');
      }
    } else {
      console.log('⚠ Could not find admin panel button reference');
    }
  } else {
    console.log('⚠ Admin panel button not found');
  }
  
  console.log('Testing mobile responsiveness...');
  
  // Resize to mobile dimensions
  await mcp_playwright_browser_resize({ width: 375, height: 667 });
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // Take mobile screenshot
  await mcp_playwright_browser_take_screenshot({ filename: 'main-pos-mobile.png' });
  
  // Check layout on mobile
  const mobileLayoutCheck = await mcp_playwright_browser_evaluate({
    function: "() => { " +
      "const productGrid = document.querySelector('div.w-2\\\\/3'); " +
      "const orderPanel = document.querySelector('div.w-1\\\\/3'); " +
      "return { " +
        "productGridVisible: !!productGrid, " +
        "orderPanelVisible: !!orderPanel " +
      "}; " +
    "}"
  });
  
  if (mobileLayoutCheck.productGridVisible && mobileLayoutCheck.orderPanelVisible) {
    console.log('✓ Layout elements are visible on mobile');
  } else {
    console.log('✗ Some layout elements may not be visible on mobile');
  }
  
  console.log('Testing cross-browser compatibility (checking for scrollbar support)...');
  
  // Check for scrollbar styling (both WebKit and Firefox)
  const scrollbarCheck = await mcp_playwright_browser_evaluate({
    function: "() => { " +
      "const styleSheets = Array.from(document.styleSheets); " +
      "let hasScrollbarStyles = false; " +
      "for (const sheet of styleSheets) { " +
        "try { " +
          "const rules = Array.from(sheet.cssRules); " +
          "for (const rule of rules) { " +
            "if (rule.cssText && (rule.cssText.includes('scrollbar') || rule.cssText.includes('::-webkit-scrollbar'))) { " +
              "hasScrollbarStyles = true; " +
              "break; " +
            "} " +
          "} " +
          "if (hasScrollbarStyles) break; " +
        "} catch(e) {} " +
      "} " +
      "return hasScrollbarStyles; " +
    "}"
  });
  
  if (scrollbarCheck) {
    console.log('✓ Cross-browser scrollbar support detected');
  } else {
    console.log('✗ Cross-browser scrollbar support not detected');
  }
  
  console.log('All CSS improvement tests completed!');
}

// Helper function to find element references from snapshots
function findElementRef(snapshot: string, elementType: string, textOrAttribute: string): string | null {
  // This is a simplified version - in real implementation you'd parse the accessibility tree
  const regex = new RegExp(`- (${elementType}|"${textOrAttribute}".*?) ref="(e\\d+)"`, 'i');
  const match = snapshot.match(regex);
  return match ? match[2] : null;
}

// Run the tests
runCSSTesting().catch(console.error);