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
    // A plain column update, not load-then-save(): see TripService for why
    // mixing a raw FK column write with an already (eagerly) loaded relation
    // object on the same entity is unreliable. update() never loads or
    // touches the relation object at all, so there's nothing to conflict
    // with. getById() re-fetches a clean, fresh entity for the response.
    await this.productRepo.update(id, { preferredShopId });
    return this.getById(id);
  }
}
