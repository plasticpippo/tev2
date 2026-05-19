import { PrismaClient } from '@prisma/client';
import { PERMISSION_MODULES, generatePermissionKey, OWNER_ROLE_NAME, VENUE_MANAGER_ROLE_NAME, CASHIER_ROLE_NAME } from '../src/permissions/permissionRegistry';

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  console.log('Starting roles and permissions seed...');

  const defaultVenue = await prisma.venue.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Default Venue',
      address: null,
      isActive: true,
    },
  });

  console.log('Default venue created/found:', defaultVenue.id);

  const allPermissions = [];

  for (const module of PERMISSION_MODULES) {
    for (const action of module.actions) {
      const key = generatePermissionKey(module.name, action.name);
      allPermissions.push({
        module: module.name,
        action: action.name,
        field: null,
        key,
        description: `${module.name} ${action.name}`,
      });

      if (action.fields && action.fields.length > 0) {
        for (const field of action.fields) {
          const fieldKey = generatePermissionKey(module.name, action.name, field);
          allPermissions.push({
            module: module.name,
            action: action.name,
            field,
            key: fieldKey,
            description: `${module.name} ${action.name} field: ${field}`,
          });
        }
      }
    }
  }

  console.log(`Creating ${allPermissions.length} permissions...`);

  for (const perm of allPermissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  console.log('Permissions created.');

  const permissions = await prisma.permission.findMany();

  const ownerRole = await prisma.role.upsert({
    where: { name: OWNER_ROLE_NAME },
    update: {},
    create: {
      name: OWNER_ROLE_NAME,
      description: 'Organization owner with full access to all venues',
      scope: 'ORGANIZATION',
      isSystem: true,
    },
  });

  console.log('Owner role created:', ownerRole.id);

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: permission.id,
        excluded: false,
      },
    });
  }

  console.log('Owner role permissions assigned.');

  const venueManagerRole = await prisma.role.upsert({
    where: { name: VENUE_MANAGER_ROLE_NAME },
    update: {},
    create: {
      name: VENUE_MANAGER_ROLE_NAME,
      description: 'Venue manager with access to venue-level operations',
      scope: 'VENUE',
      isSystem: true,
      parentRoleId: ownerRole.id,
    },
  });

  console.log('Venue Manager role created:', venueManagerRole.id);

  const venueManagerPermissions = permissions.filter((p) => {
    const isOrgOnly = ['venues', 'roles'].includes(p.module) && ['create', 'delete'].includes(p.action);
    return !isOrgOnly;
  });

  for (const permission of venueManagerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: venueManagerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: venueManagerRole.id,
        permissionId: permission.id,
        excluded: false,
      },
    });
  }

  console.log('Venue Manager role permissions assigned.');

  const cashierRole = await prisma.role.upsert({
    where: { name: CASHIER_ROLE_NAME },
    update: {},
    create: {
      name: CASHIER_ROLE_NAME,
      description: 'Cashier with restricted POS permissions',
      scope: 'VENUE',
      isSystem: true,
      parentRoleId: venueManagerRole.id,
    },
  });

  console.log('Cashier role created:', cashierRole.id);

  const cashierPermissionKeys = [
    'transactions:process',
    'orders:create',
    'orders:read',
    'orders:update',
    'tables:read',
    'tables:update',
    'customers:read',
    'customers:create',
    'stock:read',
    'receipts:read',
    'tills:read',
  ];

  const cashierPermissions = permissions.filter((p) =>
    cashierPermissionKeys.includes(p.key)
  );

  for (const permission of cashierPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: cashierRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: cashierRole.id,
        permissionId: permission.id,
        excluded: false,
      },
    });
  }

  console.log('Cashier role permissions assigned.');

  const users = await prisma.user.findMany();

  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    const role = user.role.toUpperCase();

    if (role === 'ADMIN') {
      const existing = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: user.id,
          roleId: ownerRole.id,
          venueId: null,
        },
      });

      if (!existing) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id,
            venueId: null,
            assignedBy: user.id,
          },
        });
      }
      console.log(`User ${user.username} assigned Owner role`);
    } else if (role === 'CASHIER') {
      const existing = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: user.id,
          roleId: cashierRole.id,
          venueId: defaultVenue.id,
        },
      });

      if (!existing) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: cashierRole.id,
            venueId: defaultVenue.id,
            assignedBy: user.id,
          },
        });
      }
      console.log(`User ${user.username} assigned Cashier role at venue ${defaultVenue.id}`);
    }
  }

  console.log('Roles and permissions seed completed successfully!');
}

seedRolesAndPermissions()
  .catch((e) => {
    console.error('Error seeding roles and permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });