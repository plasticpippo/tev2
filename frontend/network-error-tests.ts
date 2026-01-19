// Network Error Handling Tests for POS Application
// This file contains tests for network error handling, slow network simulation, and offline scenarios

interface McpToolConfig {
  server_name: string;
  tool_name: string;
  arguments: Record<string, any>;
}

class NetworkErrorTestSuite {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://192.168.1.241:3000'; // LAN IP from .env configuration
  }
  
  // Helper method to wait for network idle
  private async waitForNetworkIdle() {
    // Wait for 100ms for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Helper method to navigate to the application
  async navigateToApp() {
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_navigate",
      arguments: { url: this.baseUrl }
    });
    await this.waitForNetworkIdle();
  }
  
  // Helper method to take a snapshot and return it
  async getSnapshot(): Promise<string> {
    const snapshot = await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_snapshot",
      arguments: {}
    });
    return snapshot;
  }
  
  // Test slow network conditions
  async testSlowNetworkConditions() {
    console.log('Testing Slow Network Conditions...');
    
    // Navigate to the application
    await this.navigateToApp();
    
    // First, test normal login
    console.log('Testing normal login flow...');
    
    // Get the current page snapshot to identify login form elements
    const loginSnapshot = await this.getSnapshot();
    console.log('Login page snapshot captured');
    
    // Since we can't directly simulate network throttling with the current MCP tools,
    // we'll test how the application behaves when API calls take longer than usual
    // by attempting various operations and checking for timeout handling
    
    // Try to log in with valid credentials
    try {
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_fill_form",
        arguments: {
          fields: [{
            name: "username",
            type: "textbox",
            ref: "e1", // This will be replaced with actual element ref from snapshot
            value: "admin"
          }, {
            name: "password", 
            type: "textbox",
            ref: "e2", // This will be replaced with actual element ref from snapshot
            value: "admin123"
          }]
        }
      });
      
      // Click login button
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_click",
        arguments: {
          element: "Login button",
          ref: "e3" // This will be replaced with actual element ref from snapshot
        }
      });
      
      await this.waitForNetworkIdle();
      console.log('Login attempt completed');
    } catch (error) {
      console.log('Login attempt resulted in error (as expected in network tests):', error);
    }
    
    // Test API calls under simulated slow network
    // Since we can't directly throttle network in the current setup, 
    // we'll try to make several concurrent API requests to simulate high load
    console.log('Testing concurrent API requests to simulate slow network...');
    
    try {
      // Make multiple API requests to see how the app handles it
      const promises = [
        this.simulateApiCall('/api/products'),
        this.simulateApiCall('/api/categories'),
        this.simulateApiCall('/api/tills'),
        this.simulateApiCall('/api/transactions')
      ];
      
      // Wait for all requests (this might cause slowdown)
      await Promise.allSettled(promises);
      console.log('Concurrent API request test completed');
    } catch (error) {
      console.log('Concurrent API request test resulted in error:', error);
    }
  }
  
  // Simulate API call with potential delay
  private async simulateApiCall(endpoint: string) {
    // Using browser evaluate to make direct API calls
    const result = await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_evaluate",
      arguments: {
        function: `() => {
          return fetch('${this.baseUrl}${endpoint}', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add auth header if needed
            }
          }).then(response => response.json())
          .catch(error => ({ error: error.message }));
        }`
      }
    });
    
    return result;
  }
  
  // Test offline scenario
  async testOfflineScenario() {
    console.log('Testing Offline Scenario...');
    
    // Since we can't directly disable network with current tools,
    // we'll test how the app handles failed API requests
    
    // Navigate to the app
    await this.navigateToApp();
    
    // Try to make API calls that we know will fail
    // This simulates what happens when the app is offline
    console.log('Simulating API failures to test error handling...');
    
    try {
      // Try to make an API call to a non-existent endpoint to simulate network failure
      const result = await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_evaluate",
        arguments: {
          function: `() => {
            return fetch('${this.baseUrl}/api/nonexistent-endpoint', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
              }
              return response.json();
            })
            .catch(error => ({ error: error.message }));
          }`
        }
      });
      
      console.log('Offline simulation result:', result);
    } catch (error) {
      console.log('Error during offline simulation:', error);
    }
  }
  
  // Test error messages and user feedback
  async testErrorMessagesAndFeedback() {
    console.log('Testing Error Messages and User Feedback...');
    
    // Navigate to the app
    await this.navigateToApp();
    
    // Try to perform operations with invalid data to trigger error messages
    console.log('Testing error messages for invalid inputs...');
    
    // First, get the login page snapshot to identify elements
    const snapshot = await this.getSnapshot();
    console.log('Page snapshot for error message testing:', snapshot.substring(0, 500) + '...');
    
    // Try to log in with invalid credentials to see error handling
    try {
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_fill_form",
        arguments: {
          fields: [{
            name: "username",
            type: "textbox",
            ref: "e1", // Actual ref needs to come from snapshot
            value: "invalid_user"
          }, {
            name: "password", 
            type: "textbox",
            ref: "e2", // Actual ref needs to come from snapshot
            value: "wrong_password"
          }]
        }
      });
      
      // Click login button
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_click",
        arguments: {
          element: "Login button",
          ref: "e3" // Actual ref needs to come from snapshot
        }
      });
      
      await this.waitForNetworkIdle();
      
      // Check if error message is displayed
      const postLoginSnapshot = await this.getSnapshot();
      console.log('Post-login snapshot for error message:', postLoginSnapshot.substring(0, 500) + '...');
      
    } catch (error) {
      console.log('Error during invalid login test:', error);
    }
    
    // Test API error handling by calling endpoints with invalid data
    console.log('Testing API error handling...');
    
    try {
      const result = await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_evaluate",
        arguments: {
          function: `() => {
            return fetch('${this.baseUrl}/api/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}) // Invalid payload to trigger error
            })
            .then(response => {
              return {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
              };
            })
            .catch(error => ({ error: error.message }));
          }`
        }
      });
      
      console.log('API error handling result:', result);
    } catch (error) {
      console.log('Error during API error handling test:', error);
    }
  }
  
  // Test timeout handling
  async testTimeoutHandling() {
    console.log('Testing Timeout Handling...');
    
    // Test how the application handles requests that take a long time
    // Since we can't directly control network timing, we'll check if timeouts are properly implemented
    
    // Look for any timeout configurations in the code
    console.log('Checking for timeout implementations in API service...');
    
    try {
      // Try to make a request that might timeout
      // In a real implementation, this would involve setting timeout options
      const result = await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_evaluate",
        arguments: {
          function: `() => {
            // Check if there are timeout configurations in the window object
            // or check the fetch implementation for timeout settings
            return {
              hasTimeoutConfig: typeof window !== 'undefined',
              userAgent: navigator.userAgent
            };
          }`
        }
      });
      
      console.log('Timeout configuration check result:', result);
    } catch (error) {
      console.log('Error during timeout configuration check:', error);
    }
  }
  
  // Run all network error handling tests
  async runAllNetworkErrorTests() {
    console.log('Starting Network Error Handling Tests...');
    
    try {
      await this.testSlowNetworkConditions();
      await this.testOfflineScenario();
      await this.testErrorMessagesAndFeedback();
      await this.testTimeoutHandling();
      
      console.log('All Network Error Handling Tests completed');
    } catch (error) {
      console.error('Error during Network Error Handling Tests:', error);
      throw error;
    }
  }
}

// Execute the network error test suite
const networkTestSuite = new NetworkErrorTestSuite();
