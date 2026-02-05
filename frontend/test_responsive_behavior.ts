// Test script for responsive behavior verification
// Using Playwright MCP server to test responsive behavior

async function testResponsiveBehavior() {
  console.log('Starting responsive behavior testing...');
  
  // Navigate to the POS application
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_navigate",
    arguments: { url: "http://192.168.1.241:3000" }
  });
  
  // Wait for page to load
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 2 }
  });
  
  // Get page snapshot to check current state
  const initialSnapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  console.log('Initial page loaded, checking for login screen...');
  
  // Check if we're on the login page and log in if needed
  if (initialSnapshot.includes('username') && initialSnapshot.includes('password')) {
    console.log('On login screen, attempting to log in...');
    
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_fill_form",
      arguments: {
        fields: [
          {
            name: "username",
            type: "textbox",
            ref: "e11",  // This would be the actual element ID from the snapshot
            value: "admin"
          },
          {
            name: "password",
            type: "textbox", 
            ref: "e14",  // This would be the actual element ID from the snapshot
            value: "admin123"
          }
        ]
      }
    });
    
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_click",
      arguments: { element: "Login button", ref: "e15" }  // This would be the actual element ID from the snapshot
    });
    
    // Wait for login to complete
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_wait_for",
      arguments: { time: 3 }
    });
  }
  
  // Test different screen sizes for responsive behavior
  const screenSizes = [
    { width: 320, height: 568, label: 'Mobile S (iPhone SE)' },
    { width: 375, height: 667, label: 'Mobile M (iPhone 6/7/8)' },
    { width: 414, height: 896, label: 'Mobile L (iPhone XR)' },
    { width: 768, height: 1024, label: 'Tablet (iPad)' },
    { width: 1024, height: 768, label: 'Tablet Landscape' },
    { width: 1200, height: 800, label: 'Desktop' }
  ];
  
  for (const size of screenSizes) {
    console.log(`Testing responsive behavior on ${size.label}: ${size.width}x${size.height}`);
    
    // Set viewport size
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_evaluate",
      arguments: {
        function: `() => { window.resizeTo(${size.width}, ${size.height}); }`
      }
    });
    
    // Wait for UI to adjust
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_wait_for",
      arguments: { time: 1 }
    });
    
    // Get snapshot to analyze responsive elements
    const snapshot = await use_mcp_tool({
      server_name: "playwright", 
      tool_name: "browser_snapshot",
      arguments: {}
    });
    
    // Look for responsive classes in the snapshot
    const hasMaxWidthXS = snapshot.includes('max-w-xs');
    const hasSmMaxWidthMD = snapshot.includes('sm:max-w-md');
    const hasResponsiveButtons = snapshot.includes('btn') && (snapshot.includes('btn-primary') || snapshot.includes('btn-secondary'));
    
    console.log(`  - max-w-xs class present: ${hasMaxWidthXS}`);
    console.log(`  - sm:max-w-md class present: ${hasSmMaxWidthMD}`);
    console.log(`  - Responsive button classes present: ${hasResponsiveButtons}`);
    
    // Look for modal elements if they exist
    const hasModalClasses = snapshot.includes('fixed') && snapshot.includes('inset-0') && (snapshot.includes('max-w-xs') || snapshot.includes('sm:max-w'));
    console.log(`  - Modal responsive classes present: ${hasModalClasses}`);
  }
  
  // Test specific modal components if they can be triggered
  console.log('Attempting to test modal responsive behavior...');
  
  // Try to find and interact with a payment modal trigger
  const snapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot", 
    arguments: {}
  });
  
  // Look for common modal trigger elements
  if (snapshot.includes('Complete Payment') || snapshot.includes('payment') || snapshot.includes('modal')) {
    console.log('Found potential modal triggers, attempting to open modal...');
    
    // Try to click a payment-related button
    try {
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_click",
        arguments: { element: "Complete Payment", ref: "some-ref-id" } // Actual ref would come from snapshot
      });
      
      // Wait for modal to appear
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_wait_for",
        arguments: { time: 1 }
      });
      
      // Check modal responsive classes
      const modalSnapshot = await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_snapshot",
        arguments: {}
      });
      
      console.log('Modal opened, checking responsive classes...');
      console.log(`  - Has responsive width classes: ${modalSnapshot.includes('max-w-xs') || modalSnapshot.includes('sm:max-w-')}`);
      console.log(`  - Has responsive padding: ${modalSnapshot.includes('p-6') || modalSnapshot.includes('p-4')}`);
      
      // Close modal by pressing Escape
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_evaluate",
        arguments: {
          function: "() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); }"
        }
      });
    } catch (error) {
      console.log('Could not open modal or modal not available in current state');
    }
  }
  
  // Final assessment
  console.log('\nResponsive behavior testing completed.');
  console.log('- Check that modal components adapt to different screen sizes');
  console.log('- Verify that responsive prefixes (max-w-xs sm:max-w-md) work correctly'); 
  console.log('- Confirm that button classes (btn, btn-primary, etc.) maintain consistency');
  console.log('- Ensure modals maintain proper padding and spacing on small screens');
  console.log('- Verify text remains readable on all screen sizes');
  console.log('- Confirm interactive elements maintain proper touch targets');
}

// Run the test
testResponsiveBehavior().catch(console.error);