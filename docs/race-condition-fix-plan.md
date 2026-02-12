# Race Condition Fix Plan for orderSessions.ts

## Executive Summary

This document outlines the race condition vulnerabilities identified in [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts) and provides a detailed fix plan using Prisma transactions.

## Severity: HIGH

Race conditions in order session handling can lead to:
- Lost updates when concurrent requests modify the same session
- Inconsistent state between session status and items
- Data corruption during critical operations like payment completion

---

## Identified Race Condition Patterns

### Pattern: Find-Then-Update Outside Transaction

The vulnerable pattern follows this structure:

```typescript
// VULNERABLE PATTERN
const record = await prisma.model.findFirst({ where: {...} });  // Step 1
// ... time window where another request can modify the same record ...
await prisma.model.update({ where: { id: record.id }, data: {...} });  // Step 2
```

**Problem:** Between Step 1 and Step 2, another request can:
1. Read the same initial state
2. Make updates based on stale data
3. Cause one update to overwrite the other

---

## Vulnerable Endpoints

### 1. PUT /current (Lines 200-237)

**Location:** [`orderSessionsRouter.put('/current', ...)`](backend/src/handlers/orderSessions.ts:200)

**Current Vulnerable Code:**

```typescript
orderSessionsRouter.put('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    // RACE CONDITION: Find operation outside transaction
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // RACE CONDITION: Update based on potentially stale data
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        items: JSON.stringify(items),
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    // ...
  }
});
```

**Race Condition Scenario:**
1. Request A finds session with items `[X, Y]`
2. Request B finds session with items `[X, Y]`
3. Request A updates items to `[X, Y, Z]`
4. Request B updates items to `[X, Y, W]` - overwrites Request A's update
5. Result: Item Z is lost

---

### 2. PUT /current/logout (Lines 241-290)

**Location:** [`orderSessionsRouter.put('/current/logout', ...)`](backend/src/handlers/orderSessions.ts:241)

**Current Vulnerable Code:**

```typescript
orderSessionsRouter.put('/current/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // RACE CONDITION: Find operation outside transaction
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // RACE CONDITION: Update based on potentially stale data
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: 'pending_logout',
        logoutTime: new Date(),
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    // ...
  }
});
```

**Race Condition Scenario:**
1. Request A finds active session
2. Request B finds active session
3. Request A sets status to `pending_logout`
4. Request B sets status to `pending_logout` with new `logoutTime`
5. Result: Inconsistent logout timing, potential duplicate processing

---

### 3. PUT /current/complete (Lines 292-328)

**Location:** [`orderSessionsRouter.put('/current/complete', ...)`](backend/src/handlers/orderSessions.ts:292)

**Current Vulnerable Code:**

```typescript
orderSessionsRouter.put('/current/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // RACE CONDITION: Find operation outside transaction
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // RACE CONDITION: Update based on potentially stale data
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    // ...
  }
});
```

**Race Condition Scenario - CRITICAL:**
1. User initiates payment from two browser tabs
2. Request A finds active session
3. Request B finds active session
4. Both requests mark session as completed
5. Result: Double payment processing, incorrect order counts

---

### 4. PUT /current/assign-tab (Lines 331-368)

**Location:** [`orderSessionsRouter.put('/current/assign-tab', ...)`](backend/src/handlers/orderSessions.ts:331)

**Current Vulnerable Code:**

```typescript
orderSessionsRouter.put('/current/assign-tab', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // RACE CONDITION: Find operation outside transaction
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // RACE CONDITION: Update based on potentially stale data
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    // ...
  }
});
```

---

## Proposed Fixes

### Fix Strategy: Prisma Interactive Transactions

Wrap all find-then-update operations in `prisma.$transaction()` to ensure atomicity.

### Fixed Code: PUT /current

```typescript
orderSessionsRouter.put('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    // FIX: Use transaction for atomic find-and-update
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      return await tx.orderSession.update({
        where: { id: orderSession.id },
        data: {
          items: JSON.stringify(items),
          updatedAt: new Date()
        }
      });
    });

    res.json(updatedOrderSession);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'No active order session found' });
    }
    logError(error instanceof Error ? error : 'Error updating order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update order session' });
  }
});
```

### Fixed Code: PUT /current/logout

```typescript
orderSessionsRouter.put('/current/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`[PUT /api/order-sessions/current/logout] Logout request for userId: ${userId}`);

    // FIX: Use transaction for atomic find-and-update
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      const itemsCount = typeof orderSession.items === 'string' ? JSON.parse(orderSession.items).length : 0;
      console.log(`[PUT /api/order-sessions/current/logout] Found active session: ${orderSession.id} with ${itemsCount} items, marking as pending_logout`);

      return await tx.orderSession.update({
        where: { id: orderSession.id },
        data: {
          status: 'pending_logout',
          logoutTime: new Date(),
          updatedAt: new Date()
        }
      });
    });

    console.log(`[PUT /api/order-sessions/current/logout] Successfully marked session as pending_logout: ${updatedOrderSession.id}`);
    res.json(updatedOrderSession);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      console.log(`[PUT /api/order-sessions/current/logout] No active session found`);
      return res.status(404).json({ error: 'No active order session found' });
    }
    logError(error instanceof Error ? error : 'Error marking order session for logout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to mark order session for logout' });
  }
});
```

### Fixed Code: PUT /current/complete

```typescript
orderSessionsRouter.put('/current/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // FIX: Use transaction for atomic find-and-update
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      return await tx.orderSession.update({
        where: { id: orderSession.id },
        data: {
          status: 'completed',
          updatedAt: new Date()
        }
      });
    });

    res.json(updatedOrderSession);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'No active order session found' });
    }
    logError(error instanceof Error ? error : 'Error completing order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to complete order session' });
  }
});
```

### Fixed Code: PUT /current/assign-tab

```typescript
orderSessionsRouter.put('/current/assign-tab', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // FIX: Use transaction for atomic find-and-update
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      return await tx.orderSession.update({
        where: { id: orderSession.id },
        data: {
          status: 'completed',
          updatedAt: new Date()
        }
      });
    });

    res.json(updatedOrderSession);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'No active order session found' });
    }
    logError(error instanceof Error ? error : 'Error assigning order session to tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to assign order session to tab' });
  }
});
```

---

## Edge Cases and Considerations

### 1. Transaction Timeouts

Prisma transactions have a default timeout. For high-load scenarios, consider:

```typescript
await prisma.$transaction(async (tx) => {
  // ... operations
}, {
  maxWait: 5000,    // Maximum time to wait for transaction to start
  timeout: 10000,   // Maximum time for transaction to complete
});
```

### 2. Retry Logic for Write Conflicts

When multiple transactions conflict, Prisma may throw `Prisma.PrismaClientKnownRequestError` with code `P2034`. Consider implementing retry logic:

```typescript
import { Prisma } from '@prisma/client';

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        lastError = error;
        console.log(`Transaction conflict, retrying (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}
```

### 3. Idempotency for Complete Endpoint

For the `/complete` endpoint, consider making it idempotent:

```typescript
const updatedOrderSession = await prisma.$transaction(async (tx) => {
  const orderSession = await tx.orderSession.findFirst({
    where: {
      userId,
      status: 'active'
    }
  });

  if (!orderSession) {
    // Check if already completed - return existing for idempotency
    const completedSession = await tx.orderSession.findFirst({
      where: {
        userId,
        status: 'completed'
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (completedSession) {
      return completedSession; // Return already completed session
    }
    
    throw new Error('NOT_FOUND');
  }

  return await tx.orderSession.update({
    where: { id: orderSession.id },
    data: {
      status: 'completed',
      updatedAt: new Date()
    }
  });
});
```

---

## Testing Recommendations

### 1. Concurrent Request Testing

Use Playwright MCP to simulate concurrent requests:

```typescript
// Test concurrent updates to the same session
async function testConcurrentUpdates() {
  // Setup: Create a session with initial items
  // Execute: Send two PUT /current requests simultaneously
  // Verify: Final state should reflect one of the updates, not a corrupted state
}
```

### 2. Transaction Conflict Testing

```typescript
// Test that transaction conflicts are handled properly
async function testTransactionConflict() {
  // Setup: Create a session
  // Execute: Start two transactions that modify the same session
  // Verify: One succeeds, one retries or fails gracefully
}
```

### 3. Load Testing

Use tools like `k6` or `artillery` to simulate high concurrency:

```javascript
// k6 script example
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const payload = JSON.stringify({ items: [{ id: 1, qty: 1 }] });
  const res = http.put('http://localhost:3000/api/order-sessions/current', payload, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'no race condition': (r) => !r.json().error,
  });
}
```

### 4. Integration Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-RC-001 | Concurrent PUT /current requests | One update wins, no data corruption |
| TC-RC-002 | Concurrent logout requests | Single logout recorded |
| TC-RC-003 | Concurrent complete requests | Single completion, no double processing |
| TC-RC-004 | Complete then update | Update fails, session already completed |
| TC-RC-005 | High load scenario | All requests handled, no deadlocks |

---

## Implementation Checklist

- [ ] Fix PUT /current endpoint with transaction
- [ ] Fix PUT /current/logout endpoint with transaction
- [ ] Fix PUT /current/complete endpoint with transaction
- [ ] Fix PUT /current/assign-tab endpoint with transaction
- [ ] Add retry logic for transaction conflicts
- [ ] Add integration tests for race conditions
- [ ] Load test the fixed endpoints
- [ ] Update API documentation

---

## References

- [Prisma Transactions Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Prisma Error Codes Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [OWASP Race Condition Guide](https://owasp.org/www-community/vulnerabilities/Race_conditions)
