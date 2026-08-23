import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { NotFoundError } from '../utils/errors';

export class ProductService {
  private productRepo = AppDataSource.getRepository(Product);

  async list(options?: { unassigned?: boolean; categoryId?: string }) {
    let query = this.productRepo.createQueryBuilder('product').leftJoinAndSelect('product.preferredShop', 'shop');

    if (options?.unassigned) {
      query = query.where('product.preferredShopId IS NULL');
    }

    if (options?.categoryId) {
      query = query.andWhere('product.categoryId = :categoryId', { categoryId: options.categoryId });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }

  async getById(id: string) {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['preferredShop'] });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async create(name: string, categoryId: string) {
    const product = this.productRepo.create({ name, categoryId });
    return this.productRepo.save(product);
  }

  async updatePreferredShop(id: string, preferredShopId: string) {
    const product = await this.getById(id);
    product.preferredShopId = preferredShopId;
    return this.productRepo.save(product);
  }
}
