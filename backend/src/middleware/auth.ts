import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // For now, we'll implement a simple authentication bypass
  // In a real application, you would validate the token here
  // For this POS system, we'll just proceed to the next middleware
  next();
};