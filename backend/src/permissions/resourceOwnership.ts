import prisma from '../prisma';

export async function checkOwnership(
  userId: number,
  resourceType: string,
  resourceId: string,
  venueId: number
): Promise<boolean> {
  try {
    const ownership = await prisma.resourceOwnership.findUnique({
      where: {
        resourceType_resourceId: {
          resourceType,
          resourceId,
        },
      },
    });

    if (!ownership) {
      return false;
    }

    return ownership.userId === userId && ownership.venueId === venueId;
  } catch (error) {
    console.error('Error checking ownership:', error);
    return false;
  }
}

export async function getOwnedResources(
  userId: number,
  resourceType: string,
  venueId?: number
): Promise<string[]> {
  try {
    const ownerships = await prisma.resourceOwnership.findMany({
      where: {
        userId,
        resourceType,
        ...(venueId != null && { venueId }),
      },
    });

    return ownerships.map((o: any) => o.resourceId as string);
  } catch (error) {
    console.error('Error getting owned resources:', error);
    return [];
  }
}

export async function grantOwnership(
  userId: number,
  resourceType: string,
  resourceId: string,
  venueId: number
): Promise<void> {
  await prisma.resourceOwnership.upsert({
    where: {
      resourceType_resourceId: {
        resourceType,
        resourceId,
      },
    },
    create: {
      resourceType,
      resourceId,
      userId,
      venueId,
    },
    update: {
      userId,
      venueId,
    },
  });
}

export async function revokeOwnership(
  resourceType: string,
  resourceId: string
): Promise<void> {
  await prisma.resourceOwnership.deleteMany({
    where: {
      resourceType,
      resourceId,
    },
  });
}

export async function transferOwnership(
  resourceType: string,
  resourceId: string,
  fromUserId: number,
  toUserId: number,
  venueId: number
): Promise<boolean> {
  try {
    const ownership = await prisma.resourceOwnership.findUnique({
      where: {
        resourceType_resourceId: {
          resourceType,
          resourceId,
        },
      },
    });

    if (!ownership || ownership.userId !== fromUserId) {
      return false;
    }

    await prisma.resourceOwnership.update({
      where: {
        resourceType_resourceId: {
          resourceType,
          resourceId,
        },
      },
      data: {
        userId: toUserId,
        venueId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return false;
  }
}