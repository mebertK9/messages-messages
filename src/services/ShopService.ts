import { AppDataSource } from '../config/database';
import { Shop } from '../entities/Shop';

export class ShopService {
  private shopRepo = AppDataSource.getRepository(Shop);

  async list() {
    return this.shopRepo.find({ order: { name: 'ASC' } });
  }

  async getById(id: string) {
    return this.shopRepo.findOne({ where: { id } });
  }
}
