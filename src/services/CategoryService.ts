import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';

export class CategoryService {
  private categoryRepo = AppDataSource.getRepository(Category);

  async list() {
    return this.categoryRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async getById(id: string) {
    return this.categoryRepo.findOne({ where: { id } });
  }
}
