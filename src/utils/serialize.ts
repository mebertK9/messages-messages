import { User } from '../entities/User';

export type PublicUser = Omit<User, 'passwordHash'>;

/**
 * Strips the password hash from a User entity before it's sent in an API
 * response. Always use this instead of returning the raw entity.
 */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}
