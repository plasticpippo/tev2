import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderSession } from '../types';
import { logError, logDebug } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';

export const orderSessionsRouter = express.Router();

// GET /api/order-sessions/current - Get the current user's active order session
orderSessionsRouter.get('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);
    
    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
    }

    logDebug('[GET /api/order-sessions/current] Fetching session', { userId, correlationId: (req as any).correlationId });

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
        logDebug('[GET /api/order-sessions/current] Found active session', { sessionId: session.id, itemsCount, correlationId: (req as any).correlationId });
      } else {
        logDebug('[GET /api/order-sessions/current] No active session found, checking for pending_logout session', { correlationId: (req as any).correlationId });
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
          logDebug('[GET /api/order-sessions/current] Found pending_logout session, restoring to active', { sessionId: session.id, itemsCount, correlationId: (req as any).correlationId });
          // Restore the session to active within the same transaction
          session = await tx.orderSession.update({
            where: { id: session.id },
            data: {
              status: 'active',
              logoutTime: null,
              updatedAt: new Date()
            }
          });
          logDebug('[GET /api/order-sessions/current] Successfully restored session to active', { sessionId: session.id, correlationId: (req as any).correlationId });
        } else {
          logDebug('[GET /api/order-sessions/current] No pending_logout session found', { correlationId: (req as any).correlationId });
        }
      }
      
      return session;
    });
    
    if (!orderSession) {
      logDebug('[GET /api/order-sessions/current] No session found for user', { userId, correlationId: (req as any).correlationId });
      return res.status(404).json({ error: t('errors:orderSessions.noActiveSessionFound') });
    }
    
    // Parse the items JSON string back to array
    const orderSessionWithParsedItems = {
      ...orderSession,
      items: safeJsonParse(orderSession.items, [], { id: orderSession.id, field: 'items' }),
      createdAt: orderSession.createdAt.toISOString(),
      updatedAt: orderSession.updatedAt.toISOString(),
      logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
    };
    
    logDebug('[GET /api/order-sessions/current] Returning session', { sessionId: orderSession.id, itemsCount: orderSessionWithParsedItems.items?.length || 0, correlationId: (req as any).correlationId });
    res.json(orderSessionWithParsedItems);
  } catch (error) {
    const t = req.t.bind(req);
    logError(error instanceof Error ? error : 'Error fetching order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.fetchFailed') });
  }
});

// POST /api/order-sessions/current - Create or update the user's order session
orderSessionsRouter.post('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);
    
    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    logDebug('[POST /api/order-sessions/current] Request received', { userId, itemsCount: items?.length || 0, correlationId: (req as any).correlationId });

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
        logDebug('[POST /api/order-sessions/current] Found active session, updating', { sessionId: orderSession.id, itemsCount: items?.length || 0, correlationId: (req as any).correlationId });
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
        logDebug('[POST /api/order-sessions/current] No active session found, checking for pending_logout session', { correlationId: (req as any).correlationId });
        // Check for pending_logout session to restore
        const pendingLogoutSession = await tx.orderSession.findFirst({
          where: {
            userId,
            status: 'pending_logout'
          }
        });

        if (pendingLogoutSession) {
          const existingItemsCount = safeJsonParse(pendingLogoutSession.items, []).length;
          logDebug('[POST /api/order-sessions/current] Found pending_logout session', { sessionId: pendingLogoutSession.id, existingItemsCount, correlationId: (req as any).correlationId });

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
            logDebug('[POST /api/order-sessions/current] Updating items', { newItemsCount: items.length, correlationId: (req as any).correlationId });
            updateData.items = JSON.stringify(items);
          } else {
            logDebug('[POST /api/order-sessions/current] Preserving existing items (request has empty items)', { existingItemsCount, correlationId: (req as any).correlationId });
          }

          orderSession = await tx.orderSession.update({
            where: { id: pendingLogoutSession.id },
            data: updateData
          });
          logDebug('[POST /api/order-sessions/current] Successfully restored session to active', { sessionId: orderSession.id, correlationId: (req as any).correlationId });
          const finalItemsCount = safeJsonParse(orderSession.items, []).length;
          logDebug('[POST /api/order-sessions/current] Final items count', { finalItemsCount, correlationId: (req as any).correlationId });
        } else {
          logDebug('[POST /api/order-sessions/current] No pending_logout session found, creating new session', { itemsCount: items?.length || 0, correlationId: (req as any).correlationId });
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
          logDebug('[POST /api/order-sessions/current] Created new session', { sessionId: orderSession.id, correlationId: (req as any).correlationId });
        }
      }

      return { orderSession, wasCreated };
    });

    // Return 201 for new sessions, 200 for updates
    const statusCode = result.wasCreated ? 201 : 200;
    logDebug('[POST /api/order-sessions/current] Returning response', { statusCode, sessionId: result.orderSession.id, correlationId: (req as any).correlationId });
    res.status(statusCode).json(result.orderSession);
  } catch (error) {
    const t = req.t.bind(req);
    logError(error instanceof Error ? error : 'Error creating/updating order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.createUpdateFailed') });
  }
});

// PUT /api/order-sessions/current - Update the user's order session
orderSessionsRouter.put('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);
    
    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
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
    const t = req.t.bind(req);
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: t('errors:orderSessions.noActiveSessionFound') });
    }
    logError(error instanceof Error ? error : 'Error updating order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.updateFailed') });
  }
});

// PUT /api/order-sessions/current/logout - Mark the session as pending logout when user logs out
orderSessionsRouter.put('/current/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);

    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
    }

    logDebug('[PUT /api/order-sessions/current/logout] Logout request received', { userId, correlationId: (req as any).correlationId });

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
        logDebug('[PUT /api/order-sessions/current/logout] No active session found for user', { userId, correlationId: (req as any).correlationId });
        throw new Error('NOT_FOUND');
      }

      const itemsCount = safeJsonParse(orderSession.items, []).length;
      logDebug('[PUT /api/order-sessions/current/logout] Found active session, marking as pending_logout', { sessionId: orderSession.id, itemsCount, correlationId: (req as any).correlationId });

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
      logDebug('[PUT /api/order-sessions/current/logout] Successfully marked session as pending_logout', { sessionId: updated.id, itemsCount: updatedItemsCount, status: updated.status, correlationId: (req as any).correlationId });

      return updated;
    });

    res.json(updatedOrderSession);
  } catch (error) {
    const t = req.t.bind(req);
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: t('errors:orderSessions.noActiveSessionFound') });
    }
    logError(error instanceof Error ? error : 'Error marking order session for logout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.logoutMarkFailed') });
  }
});

// PUT /api/order-sessions/current/complete - Mark the session as completed when payment is made
orderSessionsRouter.put('/current/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);
    
    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
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
    const t = req.t.bind(req);
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: t('errors:orderSessions.noActiveSessionFound') });
    }
    logError(error instanceof Error ? error : 'Error completing order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.completeFailed') });
  }
});

// PUT /api/order-sessions/current/assign-tab - Mark the session as assigned to a tab
orderSessionsRouter.put('/current/assign-tab', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const t = req.t.bind(req);
    
    if (!userId) {
      return res.status(401).json({ error: t('errors:orderSessions.userNotAuthenticated') });
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
    const t = req.t.bind(req);
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: t('errors:orderSessions.noActiveSessionFound') });
    }
    logError(error instanceof Error ? error : 'Error assigning order session to tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:orderSessions.assignTabFailed') });
  }
});

export default orderSessionsRouter;
