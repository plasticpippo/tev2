import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../permissions/permissionEngine';
import { checkOwnership as checkResourceOwnership } from '../permissions/resourceOwnership';

interface PermissionOptions {
  resourceType?: string;
  resourceIdParam?: string;
}

export function requirePermission(permissionKey: string, options?: PermissionOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const venueId = (req as any).venueId;

      const hasPermission = await checkPermission(user.id, permissionKey, venueId);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Permission '${permissionKey}' required`,
        });
      }

      if (options?.resourceType && options?.resourceIdParam) {
        const resourceId = req.params[options.resourceIdParam];

        if (!resourceId) {
          return res.status(400).json({ error: 'Invalid resource ID' });
        }

        if (!venueId) {
          return res.status(400).json({ error: 'Venue context required' });
        }

        const isOwner = await checkResourceOwnership(
          user.id,
          options.resourceType,
          resourceId,
          venueId
        );

        if (!isOwner) {
          const adminPermission = await checkPermission(user.id, `${options.resourceType}:update`, venueId);

          if (!adminPermission) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Resource ownership or admin permission required',
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}