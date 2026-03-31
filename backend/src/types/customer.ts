export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: number;
}

export interface CreateCustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResult {
  customers: CustomerResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CustomerDuplicateCheck {
  isDuplicate: boolean;
  duplicates: CustomerResponseDTO[];
}

export interface CustomerResponseDTO {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export function toCustomerDTO(customer: any): CustomerResponseDTO {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    vatNumber: customer.vatNumber,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
    notes: customer.notes,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    createdBy: customer.createdBy,
  };
}

export function toCustomerDTOArray(customers: any[]): CustomerResponseDTO[] {
  return customers.map(toCustomerDTO);
}
