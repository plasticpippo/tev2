import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderSession } from '../types';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';

export const orderSessionsRouter = express.Router();

// GET /api/order-sessions/current - Get the current user's active order session
orderSessionsRouter.get('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`[GET /api/order-sessions/current] Fetching session for userId: ${userId}`);

    // Use a transaction to ensure atomic session restoration
    const orderSession = await prisma.$transaction(async (tx) => {
      // First try to find an active session
      let session = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });
      
      if (session) {
        const itemsCount = safeJsonParse(session.items, []).length;
        console.log(`[GET /api/order-sessions/current] Found active session: ${session.id} with ${itemsCount} items`);
      } else {
        console.log(`[GET /api/order-sessions/current] No active session found, checking for pending_logout session`);
      }
      
      // If no active session, try to find and restore a pending_logout session
      if (!session) {
        session = await tx.orderSession.findFirst({
          where: {
            userId,
            status: 'pending_logout'
          }
        });
        
        if (session) {
          const itemsCount = safeJsonParse(session.items, []).length;
          console.log(`[GET /api/order-sessions/current] Found pending_logout session: ${session.id} with ${itemsCount} items, restoring to active`);
          // Restore the session to active within the same transaction
          session = await tx.orderSession.update({
            where: { id: session.id },
            data: {
              status: 'active',
              logoutTime: null,
              updatedAt: new Date()
            }
          });
          console.log(`[GET /api/order-sessions/current] Successfully restored session to active: ${session.id}`);
        } else {
          console.log(`[GET /api/order-sessions/current] No pending_logout session found`);
        }
      }
      
      return session;
    });
    
    if (!orderSession) {
      console.log(`[GET /api/order-sessions/current] No session found for userId: ${userId}`);
      return res.status(404).json({ error: 'No active order session found' });
    }
    
    // Parse the items JSON string back to array
    const orderSessionWithParsedItems = {
      ...orderSession,
      items: safeJsonParse(orderSession.items, [], { id: orderSession.id, field: 'items' }),
      createdAt: orderSession.createdAt.toISOString(),
      updatedAt: orderSession.updatedAt.toISOString(),
      logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
    };
    
    console.log(`[GET /api/order-sessions/current] Returning session: ${orderSession.id} with ${orderSessionWithParsedItems.items?.length || 0} items`);
    res.json(orderSessionWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch order session' });
  }
});

// POST /api/order-sessions/current - Create or update the user's order session
orderSessionsRouter.post('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    console.log(`[POST /api/order-sessions/current] Request for userId: ${userId} with ${items?.length || 0} items`);

    // Use a transaction to ensure atomic session operations
    const result = await prisma.$transaction(async (tx) => {
      // Check if the user already has an active order session
      let orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      let wasCreated = false;

      if (orderSession) {
        console.log(`[POST /api/order-sessions/current] Found active session: ${orderSession.id}, updating with ${items?.length || 0} items`);
        // Update existing active session
        orderSession = await tx.orderSession.update({
          where: { id: orderSession.id },
          data: {
            items: JSON.stringify(items),
            status: 'active',
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`[POST /api/order-sessions/current] No active session found, checking for pending_logout session`);
        // Check for pending_logout session to restore
        const pendingLogoutSession = await tx.orderSession.findFirst({
          where: {
            userId,
            status: 'pending_logout'
          }
        });

        if (pendingLogoutSession) {
          const existingItemsCount = safeJsonParse(pendingLogoutSession.items, []).length;
          console.log(`[POST /api/order-sessions/current] Found pending_logout session: ${pendingLogoutSession.id} with ${existingItemsCount} items`);
          console.log(`[POST /api/order-sessions/current] Existing items: ${pendingLogoutSession.items}`);
          console.log(`[POST /api/order-sessions/current] Request items: ${JSON.stringify(items)}`);

          // Restore pending_logout session (treat as update)
          // Preserve existing items when restoring, only update if new items are provided
          const updateData: any = {
            status: 'active',
            logoutTime: null,
            updatedAt: new Date()
          };

          // Only update items if the request contains non-empty items
          // This prevents overwriting the session items when frontend sends empty array after re-login
          if (items && items.length > 0) {
            console.log(`[POST /api/order-sessions/current] Updating items with ${items.length} new items`);
            updateData.items = JSON.stringify(items);
          } else {
            console.log(`[POST /api/order-sessions/current] Preserving existing ${existingItemsCount} items (request has empty items)`);
          }

          orderSession = await tx.orderSession.update({
            where: { id: pendingLogoutSession.id },
            data: updateData
          });
          console.log(`[POST /api/order-sessions/current] Successfully restored session to active: ${orderSession.id}`);
          const finalItemsCount = safeJsonParse(orderSession.items, []).length;
          console.log(`[POST /api/order-sessions/current] Final items count: ${finalItemsCount}`);
        } else {
          console.log(`[POST /api/order-sessions/current] No pending_logout session found, creating new session with ${items?.length || 0} items`);
          // Create a new order session
          orderSession = await tx.orderSession.create({
            data: {
              userId,
              items: JSON.stringify(items),
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          wasCreated = true;
          console.log(`[POST /api/order-sessions/current] Created new session: ${orderSession.id}`);
        }
      }

      return { orderSession, wasCreated };
    });

    // Return 201 for new sessions, 200 for updates
    const statusCode = result.wasCreated ? 201 : 200;
    console.log(`[POST /api/order-sessions/current] Returning ${statusCode} for session: ${result.orderSession.id}`);
    res.status(statusCode).json(result.orderSession);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating/updating order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create/update order session' });
  }
});

// PUT /api/order-sessions/current - Update the user's order session
orderSessionsRouter.put('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    // Use transaction to prevent race conditions
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      // Find the user's active order session
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      // Update the existing session
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

// PUT /api/order-sessions/current/logout - Mark the session as pending logout when user logs out
orderSessionsRouter.put('/current/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`[PUT /api/order-sessions/current/logout] Logout request for userId: ${userId}`);

    // Use transaction to prevent race conditions
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      // Find the user's active order session
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        console.log(`[PUT /api/order-sessions/current/logout] No active session found for userId: ${userId}`);
        throw new Error('NOT_FOUND');
      }

      const itemsCount = safeJsonParse(orderSession.items, []).length;
      console.log(`[PUT /api/order-sessions/current/logout] Found active session: ${orderSession.id} with ${itemsCount} items, marking as pending_logout`);
      console.log(`[PUT /api/order-sessions/current/logout] Items before logout: ${orderSession.items}`);

      // Update the session to pending logout status - PRESERVE ITEMS
      const updated = await tx.orderSession.update({
        where: { id: orderSession.id },
        data: {
          status: 'pending_logout',
          logoutTime: new Date(),
          updatedAt: new Date()
        }
      });

      const updatedItemsCount = safeJsonParse(updated.items, []).length;
      console.log(`[PUT /api/order-sessions/current/logout] Successfully marked session as pending_logout: ${updated.id}`);
      console.log(`[PUT /api/order-sessions/current/logout] Items after logout: ${updated.items} (count: ${updatedItemsCount})`);
      console.log(`[PUT /api/order-sessions/current/logout] Status: ${updated.status}, logoutTime: ${updated.logoutTime}`);

      return updated;
    });

    res.json(updatedOrderSession);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'No active order session found' });
    }
    logError(error instanceof Error ? error : 'Error marking order session for logout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to mark order session for logout' });
  }
});

// PUT /api/order-sessions/current/complete - Mark the session as completed when payment is made
orderSessionsRouter.put('/current/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use transaction to prevent race conditions
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      // Find the user's active order session
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      // Update the session to completed status
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

// PUT /api/order-sessions/current/assign-tab - Mark the session as assigned to a tab
orderSessionsRouter.put('/current/assign-tab', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use transaction to prevent race conditions
    const updatedOrderSession = await prisma.$transaction(async (tx) => {
      // Find the user's active order session
      const orderSession = await tx.orderSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!orderSession) {
        throw new Error('NOT_FOUND');
      }

      // Update the session to completed status (since it's now assigned to a tab)
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

export default orderSessionsRouter;
