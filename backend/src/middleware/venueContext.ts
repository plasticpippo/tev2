import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { OWNER_ROLE_NAME } from '../permissions/permissionRegistry';

export async function venueContext(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      return next();
    }

    const headerVenueId = req.headers['x-venue-id'] as string | undefined;

    if (headerVenueId) {
      const parsedId = parseInt(headerVenueId, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        const venue = await prisma.venue.findFirst({
          where: { id: parsedId, isActive: true },
        });
        if (venue) {
          const hasAccess = await prisma.userRoleAssignment.findFirst({
            where: {
              userId: user.id,
              OR: [
                { role: { scope: 'ORGANIZATION' } },
                { venueId: parsedId },
              ],
            },
          });
          if (!hasAccess) {
            return res.status(403).json({ error: 'No access to this venue' });
          }
          (req as any).venueId = parsedId;
          return next();
        }
      }
    }

    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    const orgAssignment = assignments.find(a => a.role.scope === 'ORGANIZATION');

    if (orgAssignment) {
      const firstActiveVenue = await prisma.venue.findFirst({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      });
      if (!firstActiveVenue) {
        return res.status(503).json({ error: 'No active venue available' });
      }
      (req as any).venueId = firstActiveVenue.id;
      return next();
    }

    const venueAssignments = assignments.filter(a => a.venueId !== null);
    if (venueAssignments.length > 0) {
      const firstActive = venueAssignments.find(a => a.role.name !== OWNER_ROLE_NAME);
      const chosen = firstActive ?? venueAssignments[0];
      (req as any).venueId = chosen.venueId!;
      return next();
    }

    const defaultVenue = await prisma.venue.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    if (!defaultVenue) {
      return res.status(503).json({ error: 'No active venue available' });
    }
    (req as any).venueId = defaultVenue.id;

    next();
  } catch (error) {
    console.error('venueContext error:', error);
    return res.status(503).json({ error: 'Unable to resolve venue context' });
  }
}
