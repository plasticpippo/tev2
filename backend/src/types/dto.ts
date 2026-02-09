/**
 * UserResponseDTO - A safe representation of a user for API responses
 * Excludes sensitive fields like password
 */
export interface UserResponseDTO {
  id: number;
  name: string;
  username: string;
  role: string;
  tokensRevokedAt: Date | null;
}

// Transform a user object to a DTO
export function toUserDTO(user: any): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    tokensRevokedAt: user.tokensRevokedAt,
  };
}

// Transform an array of users to an array of DTOs
export function toUserDTOArray(users: any[]): UserResponseDTO[] {
  return users.map(toUserDTO);
}

// Safe representation for entities that reference users but don't expose full user data
export interface UserReferenceDTO {
  id: number;
  name: string;
}

// Transform user data to a safe reference DTO (for cases where we need to reference a user without exposing full details)
export function toUserReferenceDTO(user: any): UserReferenceDTO {
  return {
    id: user.id,
    name: user.name,
  };
}