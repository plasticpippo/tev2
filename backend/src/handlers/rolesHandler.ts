import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { getUserPermissions } from '../permissions/permissionEngine';
import { PERMISSION_MODULES, generatePermissionKey } from '../permissions/permissionRegistry';
import { logError, logAuditEvent } from '../utils/logger';

export const rolesRouter = express.Router();

rolesRouter.get('/', authenticateToken, requirePermission('roles:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const roles = await prisma.role.findMany({
      include: {
        parentRole: { select: { id: true, name: true } },
        _count: { select: { userAssignments: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    res.json(roles);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching roles', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.fetchFailed') });
  }
});

rolesRouter.post('/', authenticateToken, requirePermission('roles:create'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { name, description, scope, parentRoleId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: t('roles.nameRequired') });
    }

    const existing = await prisma.role.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ error: t('roles.duplicateName') });
    }

    if (parentRoleId) {
      const parent = await prisma.role.findUnique({ where: { id: parentRoleId } });
      if (!parent) {
        return res.status(400).json({ error: t('roles.parentNotFound') });
      }
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description || null,
        scope: scope || 'VENUE',
        isSystem: false,
        parentRoleId: parentRoleId || null,
      },
      include: {
        parentRole: { select: { id: true, name: true } },
        _count: { select: { userAssignments: true } },
      },
    });

    logAuditEvent('CONFIG_CHANGED', 'Role created', {
      roleName: role.name,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: req.user?.id, username: req.user?.username });

    res.status(201).json(role);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.createFailed') });
  }
});

rolesRouter.get('/permissions', authenticateToken, requirePermission('roles:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }, { field: 'asc' }],
    });
    res.json(permissions);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching permissions', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.permissionsFetchFailed') });
  }
});

rolesRouter.get('/:id', authenticateToken, requirePermission('roles:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('roles.invalidId') });
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        parentRole: { select: { id: true, name: true } },
        permissions: {
          include: { permission: true },
          orderBy: { permission: { key: 'asc' } },
        },
        _count: { select: { userAssignments: true } },
      },
    });

    if (!role) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    res.json(role);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.fetchOneFailed') });
  }
});

rolesRouter.put('/:id', authenticateToken, requirePermission('roles:update'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('roles.invalidId') });
    }

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    if (existing.isSystem) {
      return res.status(403).json({ error: t('roles.cannotModifySystem') });
    }

    const { name, description, scope, parentRoleId, permissions } = req.body;

    if (name !== undefined && name.trim() !== existing.name) {
      const duplicate = await prisma.role.findUnique({ where: { name: name.trim() } });
      if (duplicate) {
        return res.status(409).json({ error: t('roles.duplicateName') });
      }
    }

    if (parentRoleId !== undefined && parentRoleId !== null) {
      if (parentRoleId === id) {
        return res.status(400).json({ error: t('roles.cannotBeOwnParent') });
      }
      const parent = await prisma.role.findUnique({ where: { id: parentRoleId } });
      if (!parent) {
        return res.status(400).json({ error: t('roles.parentNotFound') });
      }
    }

    if (permissions !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });

      const permissionRecords = await prisma.permission.findMany({
        where: { id: { in: permissions.map((p: any) => p.permissionId) } },
      });
      const validIds = new Set(permissionRecords.map(p => p.id));

      const createData = permissions
        .filter((p: any) => validIds.has(p.permissionId))
        .map((p: any) => ({
          roleId: id,
          permissionId: p.permissionId,
          excluded: p.excluded || false,
        }));

      if (createData.length > 0) {
        await prisma.rolePermission.createMany({ data: createData });
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(scope !== undefined && { scope }),
        ...(parentRoleId !== undefined && { parentRoleId: parentRoleId || null }),
      },
      include: {
        parentRole: { select: { id: true, name: true } },
        permissions: {
          include: { permission: true },
          orderBy: { permission: { key: 'asc' } },
        },
        _count: { select: { userAssignments: true } },
      },
    });

    logAuditEvent('CONFIG_CHANGED', 'Role updated', {
      roleId: id,
      roleName: updated.name,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: req.user?.id, username: req.user?.username });

    res.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.updateFailed') });
  }
});

rolesRouter.delete('/:id', authenticateToken, requirePermission('roles:delete'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('roles.invalidId') });
    }

    const existing = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userAssignments: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    if (existing.isSystem) {
      return res.status(403).json({ error: t('roles.cannotDeleteSystem') });
    }

    if (existing._count.userAssignments > 0) {
      return res.status(409).json({ error: t('roles.hasUsers') });
    }

    await prisma.role.delete({ where: { id } });

    logAuditEvent('CONFIG_CHANGED', 'Role deleted', {
      roleId: id,
      roleName: existing.name,
      correlationId: (req as any).correlationId,
    }, 'high', { userId: req.user?.id, username: req.user?.username });

    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.deleteFailed') });
  }
});

rolesRouter.post('/:id/duplicate', authenticateToken, requirePermission('roles:create'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: t('roles.nameRequired') });
    }

    const source = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!source) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    const duplicate = await prisma.role.create({
      data: {
        name: name.trim(),
        description: req.body.description || source.description,
        scope: req.body.scope || source.scope,
        isSystem: false,
        parentRoleId: req.body.parentRoleId || source.parentRoleId,
        permissions: {
          createMany: {
            data: source.permissions.map(p => ({
              permissionId: p.permissionId,
              excluded: p.excluded,
            })),
          },
        },
      },
      include: {
        parentRole: { select: { id: true, name: true } },
        permissions: { include: { permission: true } },
        _count: { select: { userAssignments: true } },
      },
    });

    logAuditEvent('CONFIG_CHANGED', 'Role duplicated', {
      sourceRoleId: id,
      newRoleId: duplicate.id,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: req.user?.id, username: req.user?.username });

    res.status(201).json(duplicate);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error duplicating role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.duplicateFailed') });
  }
});

rolesRouter.get('/users/:userId/permissions', authenticateToken, requirePermission('users:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: t('users.invalidId') });
    }

    const permissions = await getUserPermissions(userId);
    res.json({ userId, permissions });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching user permissions', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.userPermissionsFetchFailed') });
  }
});

rolesRouter.post('/users/:userId/roles', authenticateToken, requirePermission('roles:assign'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: t('roles.invalidId') });
    }

    const { roleId, venueId } = req.body;
    if (!roleId) {
      return res.status(400).json({ error: t('roles.roleIdRequired') });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ error: t('roles.notFound') });
    }

    if (role.scope === 'ORGANIZATION' && venueId) {
      return res.status(400).json({ error: t('roles.orgRoleNoVenue') });
    }

    const existing = await prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        role: { scope: role.scope },
        ...(role.scope === 'VENUE' && venueId ? { venueId } : { venueId: null }),
      },
    });

    if (existing) {
      await prisma.userRoleAssignment.update({
        where: { id: existing.id },
        data: { roleId, venueId: venueId || null, assignedBy: req.user!.id },
      });
    } else {
      await prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          venueId: venueId || null,
          assignedBy: req.user!.id,
        },
      });
    }

    logAuditEvent('USER_UPDATED', 'Role assigned to user', {
      userId,
      roleId,
      venueId,
      correlationId: (req as any).correlationId,
    }, 'high', { userId: req.user?.id, username: req.user?.username });

    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true, venue: true },
    });

    res.json(assignments);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error assigning role', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.assignFailed') });
  }
});

rolesRouter.delete('/users/:userId/roles/:assignmentId', authenticateToken, requirePermission('roles:assign'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const assignmentId = Number(req.params.assignmentId);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: t('roles.invalidId') });
    }

    const assignment = await prisma.userRoleAssignment.findUnique({
      where: { id: assignmentId },
      include: { role: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: t('roles.assignmentNotFound') });
    }

    if (assignment.role.isSystem) {
      return res.status(403).json({ error: t('roles.cannotRemoveSystem') });
    }

    await prisma.userRoleAssignment.delete({ where: { id: assignmentId } });

    logAuditEvent('USER_UPDATED', 'Role removed from user', {
      userId: assignment.userId,
      roleId: assignment.roleId,
      correlationId: (req as any).correlationId,
    }, 'high', { userId: req.user?.id, username: req.user?.username });

    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error removing role assignment', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('roles.removeAssignmentFailed') });
  }
});

export default rolesRouter;
