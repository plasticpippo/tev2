import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderActivityLog } from '../types';

export const orderActivityLogsRouter = express.Router();

// GET /api/order-activity-logs - Get all order activity logs
orderActivityLogsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orderActivityLogs = await prisma.orderActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100  // Limit to last 10 logs for performance
    });
    res.json(orderActivityLogs);
  } catch (error) {
    console.error('Error fetching order activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch order activity logs' });
 }
});

// GET /api/order-activity-logs/:id - Get a specific order activity log
orderActivityLogsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderActivityLog = await prisma.orderActivityLog.findUnique({
      where: { id: Number(id) }
    });
    
    if (!orderActivityLog) {
      return res.status(404).json({ error: 'Order activity log not found' });
    }
    
    res.json(orderActivityLog);
  } catch (error) {
    console.error('Error fetching order activity log:', error);
    res.status(500).json({ error: 'Failed to fetch order activity log' });
  }
});

// POST /api/order-activity-logs - Create a new order activity log
orderActivityLogsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { action, details, userId, userName } = req.body as Omit<OrderActivityLog, 'id' | 'createdAt'>;
    
    const orderActivityLog = await prisma.orderActivityLog.create({
      data: {
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        userId,
        userName,
        createdAt: new Date()
      }
    });
    
    res.status(201).json(orderActivityLog);
  } catch (error) {
    console.error('Error creating order activity log:', error);
    res.status(500).json({ error: 'Failed to create order activity log' });
 }
});

export default orderActivityLogsRouter;