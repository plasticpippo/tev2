# Playwright MCP Usage Guide

## Overview
Playwright MCP (Model Context Protocol) server provides browser automation capabilities for testing and interacting with web applications. It enables structured accessibility snapshots and element interaction without requiring vision models.

## Key Tools and Usage

### Navigation
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_navigate",
  arguments: { url: "http://localhost:3000/api/auth/login" }
})
```
Use for navigating to URLs and testing API endpoints directly.

### Form Filling
```typescript
use_mcp_tool({
  server_name: "playwright", 
  tool_name: "browser_fill_form",
  arguments: {
    fields: [{
      name: "username",
      type: "textbox", 
      ref: "e11",
      value: "admin"
    }, {
      name: "password", 
      type: "textbox",
      ref: "e14", 
      value: "admin123"
    }]
  }
})
```
Use for filling login forms and other input fields. Get element references from accessibility snapshots.

### Clicking Elements
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_click", 
  arguments: { element: "Login button", ref: "e15" }
})
```
Use for clicking buttons and interactive elements. Handle virtual keyboards that may intercept clicks.

### Element Interaction with JavaScript
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_evaluate",
  arguments: { 
    function: "() => { document.querySelector('button[type=\"submit\"]').click(); }"
  }
})
```
Use when direct clicks fail due to overlay elements or virtual keyboards.

### API Testing with Fetch
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_evaluate", 
 arguments: {
    function: "() => { return fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) }).then(res => res.json()); }"
  }
})
```
Use for direct API testing when CORS allows it.

### Waiting and Timing
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_wait_for",
  arguments: { time: 5 }
})
```
Use to wait for page loads or animations before proceeding.

### Network Request Inspection
```typescript
use_mcp_tool({
  server_name: "playwright", 
  tool_name: "browser_network_requests",
  arguments: {}
})
```
Use to inspect API calls and network activity.

### Page State Inspection
```typescript
use_mcp_tool({
  server_name: "playwright",
  tool_name: "browser_snapshot",
  arguments: {}
})
```
Use to get accessibility tree and element references for interaction.

## Common Issues and Solutions

### Virtual Keyboard Interference
- Problem: Virtual keyboards intercept click events
- Solution: Use `browser_evaluate` to directly execute click events, or click "Done" button on virtual keyboard

### CORS Issues
- Problem: Browser fetch calls fail due to CORS restrictions
- Solution: Test through frontend application or use direct server navigation

### Rate Limiting
- Problem: Too many requests result in 429 errors
- Solution: Add delays between requests using `browser_wait_for`

### Element Reference Changes
- Problem: Element references (e.g., ref=e11) change between page loads
- Solution: Always get fresh references from latest snapshot before interaction

## Best Practices

1. Always check page snapshots before interacting with elements to get current references
2. Use `browser_wait_for` when pages take time to load
3. Handle rate limiting by adding appropriate delays
4. Test both positive and negative scenarios (valid/invalid credentials)
5. Verify error messages appear as expected
6. Use direct API calls when browser context causes issues
7. Clear browser state between test scenarios when needed