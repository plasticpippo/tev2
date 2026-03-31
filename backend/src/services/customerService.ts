import { prisma } from '../prisma';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerPagination,
  CustomerListResult,
  CustomerDuplicateCheck,
  CustomerResponseDTO,
  toCustomerDTO,
  toCustomerDTOArray,
} from '../types/customer';
import { Prisma } from '@prisma/client';

const FUZZY_MATCH_THRESHOLD = 0.8;

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  const matrix: number[][] = [];
  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter[i - 1] === longer[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[shorter.length][longer.length];
  return 1 - distance / longer.length;
}

export async function createCustomer(
  data: CreateCustomerInput,
  userId: number
): Promise<CustomerResponseDTO> {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      vatNumber: data.vatNumber ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      postalCode: data.postalCode ?? null,
      country: data.country ?? null,
      notes: data.notes ?? null,
      isActive: true,
      createdBy: userId,
      updatedAt: new Date(),
    },
  });
  
  return toCustomerDTO(customer);
}

export async function getCustomerById(id: number): Promise<CustomerResponseDTO | null> {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
  
  return customer ? toCustomerDTO(customer) : null;
}

export async function listCustomers(
  filters: CustomerFilters = {},
  pagination: CustomerPagination = { page: 1, limit: 20 }
): Promise<CustomerListResult> {
  const { page, limit, sortBy = 'name', sortOrder = 'asc' } = pagination;
  const { includeDeleted = false } = filters;

  const where: Prisma.CustomerWhereInput = {};

  if (!includeDeleted) {
    where.deletedAt = null;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
      { phone: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
      { vatNumber: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
    ];
  } else {
    if (filters.name) {
      where.name = { contains: filters.name, mode: Prisma.QueryMode.insensitive };
    }
    if (filters.email) {
      where.email = { contains: filters.email, mode: Prisma.QueryMode.insensitive };
    }
    if (filters.phone) {
      where.phone = { contains: filters.phone, mode: Prisma.QueryMode.insensitive };
    }
    if (filters.vatNumber) {
      where.vatNumber = { contains: filters.vatNumber, mode: Prisma.QueryMode.insensitive };
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }
  }
  
  const totalCount = await prisma.customer.count({ where });
  const totalPages = Math.ceil(totalCount / limit);
  
  const customers = await prisma.customer.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return {
    customers: toCustomerDTOArray(customers),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function updateCustomer(
  id: number,
  data: UpdateCustomerInput
): Promise<CustomerResponseDTO | null> {
  const existingCustomer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  });
  
  if (!existingCustomer) {
    return null;
  }
  
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    },
  });
  
  return toCustomerDTO(customer);
}

export async function softDeleteCustomer(id: number): Promise<CustomerResponseDTO | null> {
  const existingCustomer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  });
  
  if (!existingCustomer) {
    return null;
  }
  
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    },
  });
  
  return toCustomerDTO(customer);
}

export async function checkDuplicateCustomer(
  name: string,
  email?: string | null
): Promise<CustomerDuplicateCheck> {
  const potentialDuplicates = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: name, mode: Prisma.QueryMode.insensitive } },
        ...(email ? [{ email: { contains: email, mode: Prisma.QueryMode.insensitive } }] : []),
      ],
    },
  });

  const duplicates: CustomerResponseDTO[] = [];
  
  for (const customer of potentialDuplicates) {
    const nameSimilarity = calculateSimilarity(customer.name, name);
    const emailSimilarity = email && customer.email 
      ? calculateSimilarity(customer.email, email) 
      : 0;
    
const maxSimilarity = Math.max(nameSimilarity, emailSimilarity);

    if (maxSimilarity >= FUZZY_MATCH_THRESHOLD) {
      duplicates.push(toCustomerDTO(customer));
    }
  }

  return {
    isDuplicate: duplicates.length > 0,
    duplicates: duplicates,
  };
}

export async function searchCustomers(
  query: string,
  limit: number = 10
): Promise<CustomerResponseDTO[]> {
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { vatNumber: { contains: query, mode: Prisma.QueryMode.insensitive } },
      ],
    },
    orderBy: { name: 'asc' },
    take: limit,
  });

  return toCustomerDTOArray(customers);
}

export async function checkEmailUniqueness(
  email: string,
  excludeId?: number
): Promise<boolean> {
  const existing = await prisma.customer.findFirst({
    where: {
      email: email,
      deletedAt: null,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  
  return !existing;
}
