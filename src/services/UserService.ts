import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors';
import { hashPassword, comparePassword } from '../utils/password';

export class UserService {
  private userRepo = AppDataSource.getRepository(User);

  async getById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getMeData(id: string) {
    const user = await this.getById(id);
    // Return safe data (no passwordHash)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  /**
   * Self-service data maintenance: change your own email and/or password.
   * No email verification (see CreateUserForm / register - email is plain
   * data here, not a communication channel yet). A password change does
   * require the current password, though, since this is a shared household
   * device and anyone could otherwise walk up to an unlocked session and
   * lock the real user out.
   */
  async updateMe(
    id: string,
    changes: { email?: string; currentPassword?: string; newPassword?: string }
  ) {
    if (changes.email !== undefined) {
      const existing = await this.userRepo.findOne({ where: { email: changes.email } });
      if (existing && existing.id !== id) throw new ConflictError('Email already registered');
    }

    if (changes.newPassword !== undefined) {
      // passwordHash is select: false by default - needs an explicit select
      // to verify the current password.
      const user = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.id = :id', { id })
        .getOne();
      if (!user) throw new NotFoundError('User not found');

      const currentPasswordValid = await comparePassword(
        changes.currentPassword ?? '',
        user.passwordHash
      );
      if (!currentPasswordValid) throw new UnauthorizedError('Current password is incorrect');

      const passwordHash = await hashPassword(changes.newPassword);
      await this.userRepo.update(id, {
        passwordHash,
        ...(changes.email !== undefined ? { email: changes.email } : {}),
      });
    } else {
      await this.userRepo.update(id, { email: changes.email });
    }

    return this.getMeData(id);
  }
}