/**
 * Rate Limiting Test for Layouts Endpoints
 * 
 * This test verifies that the rate limiting is working correctly on the layouts endpoints.
 * Configuration: 30 requests per 1 minute window for write operations.
 * 
 * Usage: Run this test using Playwright MCP server commands
 */

const BASE_URL = 'http://192.168.1.241:3000';
const API_URL = `${BASE_URL}/api`;

interface RequestResult {
  requestNumber: number;
  status: number;
  statusText: string;
  body: any;
  isRateLimited: boolean;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  firstRateLimitAt: number | null;
  rateLimitMessage: string | null;
  results: RequestResult[];
}

/**
 * Main test function - Execute this in the browser console via Playwright MCP
 */
export async function runRateLimitingTest(): Promise<TestSummary> {
  console.log('=== Rate Limiting Test for Layouts Endpoints ===\n');
  console.log('Configuration: 30 requests per 1 minute window\n');

  const summary: TestSummary = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitedRequests: 0,
    errorRequests: 0,
    firstRateLimitAt: null,
    rateLimitMessage: null,
    results: []
  };

  // Test data for creating shared layouts
  const createTestData = (index: number) => ({
    name: `RateTestLayout_${index}_${Date.now()}`,
    categoryId: -1, // Using Favourites pseudo-category (always exists)
    positions: [
      { variantId: 1, gridColumn: 1, gridRow: 1 }
    ]
  });

  console.log('Making 35 rapid POST requests to /api/layouts/shared...\n');

  // Make 35 rapid requests
  for (let i = 1; i <= 35; i++) {
    try {
      const response = await fetch(`${API_URL}/layouts/shared`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createTestData(i))
      });

      const body = await response.json().catch(() => null);
      
      const result: RequestResult = {
        requestNumber: i,
        status: response.status,
        statusText: response.statusText,
        body,
        isRateLimited: response.status === 429
      };

      summary.results.push(result);
      summary.totalRequests++;

      if (response.status === 429) {
        summary.rateLimitedRequests++;
        if (summary.firstRateLimitAt === null) {
          summary.firstRateLimitAt = i;
          summary.rateLimitMessage = body?.message || body?.error || 'Too many requests';
        }
        console.log(`Request ${i}: 429 - RATE LIMITED (${body?.message || 'Too many requests'})`);
      } else if (response.status >= 200 && response.status < 300) {
        summary.successfulRequests++;
        console.log(`Request ${i}: ${response.status} - Success (ID: ${body?.id})`);
      } else if (response.status === 400) {
        // Validation errors still mean the request wasn't rate limited
        summary.successfulRequests++;
        console.log(`Request ${i}: ${response.status} - ${body?.error || 'Validation error (not rate limited)'}`);
      } else {
        summary.errorRequests++;
        console.log(`Request ${i}: ${response.status} - Error: ${body?.error || 'Unknown error'}`);
      }
    } catch (error) {
      summary.totalRequests++;
      summary.errorRequests++;
      console.log(`Request ${i}: Network error - ${error}`);
    }

    // Small delay to prevent browser throttling but still be rapid
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n=== Test Results ===');
  console.log(`Total requests: ${summary.totalRequests}`);
  console.log(`Successful requests: ${summary.successfulRequests}`);
  console.log(`Rate limited requests (429): ${summary.rateLimitedRequests}`);
  console.log(`Error requests: ${summary.errorRequests}`);
  console.log(`First rate limit at request #: ${summary.firstRateLimitAt || 'N/A'}`);
  console.log(`Rate limit message: ${summary.rateLimitMessage || 'N/A'}`);

  // Verification
  console.log('\n=== Verification ===');
  if (summary.firstRateLimitAt !== null && summary.firstRateLimitAt <= 31) {
    console.log('PASS: Rate limiting is working correctly!');
    console.log(`Rate limit triggered at request ${summary.firstRateLimitAt}, within expected range.`);
  } else if (summary.firstRateLimitAt === null) {
    console.log('FAIL: Rate limiting was not triggered.');
    console.log('Possible causes:');
    console.log('  - Rate limiter not configured correctly');
    console.log('  - Rate limit disabled in current environment');
    console.log('  - Rate limit window is from a different IP tracking');
  } else {
    console.log('WARNING: Rate limiting triggered later than expected.');
    console.log(`Expected around request 30-31, but got ${summary.firstRateLimitAt}.`);
  }

  return summary;
}

/**
 * Cleanup function to delete test layouts created during the test
 */
export async function cleanupTestLayouts(): Promise<void> {
  console.log('\n=== Cleaning up test layouts ===');
  
  try {
    const response = await fetch(`${API_URL}/layouts/shared`);
    const layouts = await response.json();
    
    const testLayouts = layouts.filter((l: any) => l.name && l.name.startsWith('RateTestLayout_'));
    console.log(`Found ${testLayouts.length} test layouts to delete`);
    
    for (const layout of testLayouts) {
      try {
        await fetch(`${API_URL}/layouts/shared/${layout.id}`, {
          method: 'DELETE'
        });
        console.log(`Deleted layout: ${layout.name} (ID: ${layout.id})`);
      } catch (e) {
        console.log(`Failed to delete layout ${layout.id}:`, e);
      }
    }
  } catch (error) {
    console.log('Cleanup error:', error);
  }
}

/**
 * Execute the complete test
 * Run this function in the browser console after logging in
 */
export async function executeRateLimitTest(): Promise<void> {
  try {
    const results = await runRateLimitingTest();
    
    // Cleanup test data
    await cleanupTestLayouts();
    
    console.log('\n=== Test Complete ===');
    console.log('Final Results:', JSON.stringify({
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      rateLimitedRequests: results.rateLimitedRequests,
      firstRateLimitAt: results.firstRateLimitAt,
      rateLimitMessage: results.rateLimitMessage
    }, null, 2));
    
    // Return a clear pass/fail indicator
    if (results.firstRateLimitAt !== null && results.firstRateLimitAt <= 31) {
      console.log('\nTEST RESULT: PASS');
    } else {
      console.log('\nTEST RESULT: FAIL');
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    console.log('\nTEST RESULT: FAIL');
  }
}

// Export for use with Playwright MCP
export { BASE_URL, API_URL };
export type { TestSummary, RequestResult };
