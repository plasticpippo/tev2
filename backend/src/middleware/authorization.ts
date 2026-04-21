import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { VariantLayout, SharedLayout, Table } from '@prisma/client';
import '../types';

// Define a union type for layouts that have ownerId
type LayoutWithOwner = (VariantLayout | SharedLayout) & { ownerId: number | null };

/**
 * Middleware to check if user owns a table or is admin
 * Attaches the table to req.table if found and authorized
 */
export const verifyTableOwnership = async (req: Request, res: Response, next: NextFunction) => {
  const t = req.t.bind(req);
  try {
    const tableId = req.params.id;
    
    if (!tableId) {
      return res.status(400).json({ error: t('errors.authorization.tableIdRequired') });
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId }
    }) as Table & { ownerId: number | null };

    if (!table) {
      return res.status(404).json({ error: t('errors.authorization.tableNotFound') });
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: t('errors.authorization.userNotAuthenticated') });
    }

    // Allow if user owns the table (ownerId matches) or user is admin
    // Note: ownerId can be null (unowned tables are accessible to all authenticated users)
    const isOwner = table.ownerId !== null && table.ownerId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    if (!isOwner && !isAdmin && table.ownerId !== null) {
      return res.status(403).json({ error: t('errors.authorization.tableAccessDenied') });
    }

    req.table = table;

    next();
  } catch (error) {
    console.error('Error verifying table ownership:', error);
    return res.status(500).json({ error: t('errors.authorization.verifyTableOwnershipFailed') });
  }
};

/**
 * Middleware to check layout ownership
 * Checks both VariantLayout and SharedLayout (tries VariantLayout first, then SharedLayout)
 * Attaches the layout to req.layout if found and authorized
 */
export const verifyLayoutOwnership = async (req: Request, res: Response, next: NextFunction) => {
  const t = req.t.bind(req);
  try {
    const layoutId = req.params.id;
    
    if (!layoutId) {
      return res.status(400).json({ error: t('errors.authorization.layoutIdRequired') });
    }

    const layoutIdNum = parseInt(layoutId, 10);
    
    if (isNaN(layoutIdNum)) {
      return res.status(400).json({ error: t('errors.authorization.invalidLayoutId') });
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: t('errors.authorization.userNotAuthenticated') });
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
        return res.status(403).json({ error: t('errors.authorization.layoutAccessDenied') });
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
        return res.status(403).json({ error: t('errors.authorization.layoutAccessDenied') });
      }

      // Attach layout to req.layout for later use
      req.layout = sharedLayout;
      return next();
    }

    // Return 404 if layout not found in either table
    return res.status(404).json({ error: t('errors.authorization.layoutNotFound') });
  } catch (error) {
    console.error('Error verifying layout ownership:', error);
    return res.status(500).json({ error: t('errors.authorization.verifyLayoutOwnershipFailed') });
  }
};

/**
 * Middleware to require admin role
 * Returns 403 if user is not an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const t = req.t.bind(req);
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: t('errors.authorization.userNotAuthenticated') });
    }

    // Check if user is admin (support both 'ADMIN' and 'Admin' formats)
    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    if (!isAdmin) {
      return res.status(403).json({ error: t('errors.authorization.adminPrivilegesRequired') });
    }

    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: t('errors.authorization.verifyAdminPrivilegesFailed') });
  }
};

/**
 * Middleware to require specific roles
 * @param allowedRoles - Array of allowed role strings (e.g., ['ADMIN', 'CASHIER'])
 * Returns 403 if user role is not in the allowed list
 * 
 * @example
 * // Allow both admin and cashier roles
 * requireRole(['ADMIN', 'CASHIER'])
 * 
 * // Allow only admin roles
 * requireRole(['ADMIN', 'Admin'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const t = req.t.bind(req);
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({ error: t('errors.authorization.userNotAuthenticated') });
      }

      // Check if user's role is in the allowed list (case-insensitive comparison)
      const isAllowed = allowedRoles.some(
        allowedRole => userRole.toUpperCase() === allowedRole.toUpperCase()
      );

      if (!isAllowed) {
        return res.status(403).json({ 
          error: t('errors.authorization.adminPrivilegesRequired') 
        });
      }

      next();
    } catch (error) {
      console.error('Error checking user role:', error);
      return res.status(500).json({ error: t('errors.authorization.verifyAdminPrivilegesFailed') });
    }
  };
};
