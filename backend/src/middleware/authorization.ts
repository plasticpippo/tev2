import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { VariantLayout, SharedLayout, Table } from '@prisma/client';
import '../types'; // Import types to extend Express Request interface

// Define a union type for layouts that have ownerId
type LayoutWithOwner = (VariantLayout | SharedLayout) & { ownerId: number | null };

/**
 * Middleware to check if user owns a table or is admin
 * Attaches the table to req.table if found and authorized
 */
export const verifyTableOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tableId = req.params.id;
    
    if (!tableId) {
      return res.status(400).json({ error: 'Table ID is required' });
    }

    // Query the table to get ownerId
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    }) as Table & { ownerId: number | null };

    // Return 404 if table not found
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if user owns the table or is admin
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Allow if user owns the table (ownerId matches) or user is admin
    // Note: ownerId can be null (unowned tables are accessible to all authenticated users)
    const isOwner = table.ownerId !== null && table.ownerId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    if (!isOwner && !isAdmin && table.ownerId !== null) {
      return res.status(403).json({ error: 'Access denied. You do not own this table.' });
    }

    // Attach table to req.table for later use
    req.table = table;

    next();
  } catch (error) {
    console.error('Error verifying table ownership:', error);
    return res.status(500).json({ error: 'Failed to verify table ownership' });
  }
};

/**
 * Middleware to check layout ownership
 * Checks both VariantLayout and SharedLayout (tries VariantLayout first, then SharedLayout)
 * Attaches the layout to req.layout if found and authorized
 */
export const verifyLayoutOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const layoutId = req.params.id;
    
    if (!layoutId) {
      return res.status(400).json({ error: 'Layout ID is required' });
    }

    const layoutIdNum = parseInt(layoutId, 10);
    
    if (isNaN(layoutIdNum)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Try VariantLayout first
    let variantLayout = await prisma.variantLayout.findUnique({
      where: { id: layoutIdNum }
    }) as VariantLayout & { ownerId: number | null } | null;

    if (variantLayout) {
      // Check if user owns the variant layout or is admin
      // Note: ownerId can be null (unowned layouts are accessible to all authenticated users)
      const isOwner = variantLayout.ownerId !== null && variantLayout.ownerId === userId;
      const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

      if (!isOwner && !isAdmin && variantLayout.ownerId !== null) {
        return res.status(403).json({ error: 'Access denied. You do not own this layout.' });
      }

      // Attach layout to req.layout for later use
      req.layout = variantLayout;
      return next();
    }

    // Try SharedLayout if not found in VariantLayout
    const sharedLayout = await prisma.sharedLayout.findUnique({
      where: { id: layoutIdNum }
    }) as SharedLayout & { ownerId: number | null } | null;
    
    if (sharedLayout) {
      // Check if user owns the shared layout or is admin
      // Note: ownerId can be null (unowned layouts are accessible to all authenticated users)
      const isOwner = sharedLayout.ownerId !== null && sharedLayout.ownerId === userId;
      const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

      if (!isOwner && !isAdmin && sharedLayout.ownerId !== null) {
        return res.status(403).json({ error: 'Access denied. You do not own this layout.' });
      }

      // Attach layout to req.layout for later use
      req.layout = sharedLayout;
      return next();
    }

    // Return 404 if layout not found in either table
    return res.status(404).json({ error: 'Layout not found' });
  } catch (error) {
    console.error('Error verifying layout ownership:', error);
    return res.status(500).json({ error: 'Failed to verify layout ownership' });
  }
};

/**
 * Middleware to require admin role
 * Returns 403 if user is not an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin (support both 'ADMIN' and 'Admin' formats)
    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Failed to verify admin privileges' });
  }
};
