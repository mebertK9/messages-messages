import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { NotFoundError } from '../utils/errors';

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
      email: user.email,
      name: user.name,
    };
  }
}
