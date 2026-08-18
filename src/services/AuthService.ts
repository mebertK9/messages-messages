import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, verifyToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);

  async register(email: string, name: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await hashPassword(password);
    const user = this.userRepo.create({ email, name, passwordHash });
    await this.userRepo.save(user);

    const token = signToken(user.id);
    return { accessToken: token, user };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = signToken(user.id);
    return { accessToken: token, user };
  }

  verifyToken(token: string) {
    return verifyToken(token);
  }
}
