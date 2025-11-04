import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderSession } from '../types';

// Define custom type for Request to include user information
interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const orderSessionsRouter = express.Router();

// Middleware to extract user ID from request (to be implemented with proper auth)
const authenticateUser = (req: AuthenticatedRequest, res: Response, next: any) => {
  // For now, extract userId from request body or query params for testing
  // In a real implementation, this would come from session, JWT token, etc.
 const userId = req.body.userId || req.query.userId || (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
 }
  
  req.userId = Number(userId);
  next();
};

// GET /api/order-sessions/current - Get the current user's active order session
orderSessionsRouter.get('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });
    
    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }
    
    // Parse the items JSON string back to array
    const orderSessionWithParsedItems = {
      ...orderSession,
      items: typeof orderSession.items === 'string' ? JSON.parse(orderSession.items) : orderSession.items,
      createdAt: orderSession.createdAt.toISOString(),
      updatedAt: orderSession.updatedAt.toISOString(),
      logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
    };
    
    res.json(orderSessionWithParsedItems);
  } catch (error) {
    console.error('Error fetching order session:', error);
    res.status(500).json({ error: 'Failed to fetch order session' });
  }
});

// POST /api/order-sessions/current - Create or update the user's order session
orderSessionsRouter.post('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    // Check if the user already has an active order session
    let orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (orderSession) {
      // Update existing active session
      orderSession = await prisma.orderSession.update({
        where: { id: orderSession.id },
        data: {
          items: JSON.stringify(items),
          status: 'active',
          updatedAt: new Date()
        }
      });
    } else {
      // Create a new order session
      orderSession = await prisma.orderSession.create({
        data: {
          userId,
          items: JSON.stringify(items),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    res.status(201).json(orderSession);
  } catch (error) {
    console.error('Error creating/updating order session:', error);
    res.status(500).json({ error: 'Failed to create/update order session' });
  }
});

// PUT /api/order-sessions/current - Update the user's order session
orderSessionsRouter.put('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // Update the existing session
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        items: JSON.stringify(items),
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    console.error('Error updating order session:', error);
    res.status(500).json({ error: 'Failed to update order session' });
  }
});

// PUT /api/order-sessions/current/logout - Mark the session as pending logout when user logs out
orderSessionsRouter.put('/current/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // Update the session to pending logout status
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
    console.error('Error marking order session for logout:', error);
    res.status(500).json({ error: 'Failed to mark order session for logout' });
 }
});

// PUT /api/order-sessions/current/complete - Mark the session as completed when payment is made
orderSessionsRouter.put('/current/complete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // Update the session to completed status
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    console.error('Error completing order session:', error);
    res.status(500).json({ error: 'Failed to complete order session' });
  }
});

// PUT /api/order-sessions/current/assign-tab - Mark the session as assigned to a tab
orderSessionsRouter.put('/current/assign-tab', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }

    // Update the session to completed status (since it's now assigned to a tab)
    const updatedOrderSession = await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });

    res.json(updatedOrderSession);
  } catch (error) {
    console.error('Error assigning order session to tab:', error);
    res.status(500).json({ error: 'Failed to assign order session to tab' });
 }
});

export default orderSessionsRouter;