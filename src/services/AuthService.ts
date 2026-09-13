import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, verifyToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { toPublicUser } from '../utils/serialize';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async register(name: string, password: string, email?: string) {
    const existingName = await this.userRepo.findOne({ where: { name } });
    if (existingName) throw new ConflictError('Name already taken');

    if (email) {
      const existingEmail = await this.userRepo.findOne({ where: { email } });
      if (existingEmail) throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = this.userRepo.create({ name, email, passwordHash });
    await this.userRepo.save(user);

    const token = signToken(user.id);
    return { accessToken: token, user: toPublicUser(user) };
  }

  async login(name: string, password: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.name = :name', { name })
      .getOne();
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = signToken(user.id);
    return { accessToken: token, user: toPublicUser(user) };
  }

  verifyToken(token: string) {
    return verifyToken(token);
  }
}
