import prisma from '../prisma';
import { OWNER_ROLE_NAME } from './permissionRegistry';

export async function checkPermission(
  userId: number,
  permissionKey: string,
  venueId?: number
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
                parentRole: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    for (const assignment of user.roleAssignments) {
      const role = assignment.role;

      if (role.name === OWNER_ROLE_NAME) {
        return true;
      }

      if (role.scope === 'VENUE' && !assignment.venueId) {
        continue;
      }

      if (venueId && assignment.venueId && assignment.venueId !== venueId) {
        continue;
      }

      const effectivePermissions = getEffectivePermissions(role);

      if (effectivePermissions.has(permissionKey)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

function getEffectivePermissions(role: any): Set<string> {
  const permissions = new Set<string>();
  const excluded = new Set<string>();

  const processRole = (r: any) => {
    for (const rp of r.permissions) {
      if (rp.excluded) {
        excluded.add(rp.permission.key);
      } else {
        permissions.add(rp.permission.key);
      }
    }

    if (r.parentRole) {
      processRole(r.parentRole);
    }
  };

  processRole(role);

  for (const perm of excluded) {
    permissions.delete(perm);
  }

  return permissions;
}

export async function getUserPermissions(userId: number, venueId?: number): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
                parentRole: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const allPermissions = new Set<string>();

    for (const assignment of user.roleAssignments) {
      const role = assignment.role;

      if (role.name === OWNER_ROLE_NAME) {
        return ['*'];
      }

      if (role.scope === 'VENUE' && !assignment.venueId) {
        continue;
      }

      if (venueId && assignment.venueId && assignment.venueId !== venueId) {
        continue;
      }

      const effective = getEffectivePermissions(role);
      for (const perm of effective) {
        allPermissions.add(perm);
      }
    }

    return Array.from(allPermissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

export async function getUserRoles(userId: number, venueId?: number) {
  try {
    const assignments = await prisma.userRoleAssignment.findMany({
      where: {
        userId,
        ...(venueId && { venueId }),
      },
      include: {
        role: true,
        venue: true,
      },
    });

    return assignments;
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}