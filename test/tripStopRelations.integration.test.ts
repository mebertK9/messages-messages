import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';
import { Product } from '../src/entities/Product';
import { Wish } from '../src/entities/Wish';
import { TripService } from '../src/services/TripService';
import { ProductService } from '../src/services/ProductService';
import { AuthService } from '../src/services/AuthService';
import { UserService } from '../src/services/UserService';

// Fixed ids seeded by the migrations (see SeedShops migration).
const REWE_SHOP_ID = '55555555-5555-4555-8555-555555555555';
const ALDI_SHOP_ID = '66666666-6666-4666-8666-666666666666';
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

/**
 * These tests exist because of a real, previously shipped bug: TripService
 * and ProductService both mutated a *ManyToOne id column* directly
 * (`wish.assignedTripStopId = ...`, `product.preferredShopId = ...`) on
 * entities that TypeORM had already eager-loaded together with the *old*
 * related object (`wish.assignedTripStop`, `product.preferredShop`). Setting
 * only the id column left that stale object in place, and save() could then
 * derive the persisted foreign key from the stale object instead of the id
 * we had just changed - silently keeping a wish tied to a stop it should
 * have left, or a product tied to its old preferred shop.
 *
 * The tests below therefore never trust the entity objects returned by the
 * service methods - they re-read the raw column values straight from
 * Postgres afterwards, which is the only way to actually catch this class of
 * bug.
 */
describe('trip stop / wish / product relation assignment', () => {
  let tripService: TripService;
  let productService: ProductService;
  let userId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    tripService = new TripService();
    productService = new ProductService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Full reset except the seeded master data (shops, categories) - keeps
    // every test independent without needing to track individual ids.
    await AppDataSource.query(
      'TRUNCATE TABLE notifications, wishes, trip_stops, shopping_trips, products, users RESTART IDENTITY CASCADE'
    );

    const user = await AppDataSource.manager.save(
      AppDataSource.manager.create(User, {
        email: 'buyer@example.com',
        name: 'Buyer',
        passwordHash: 'irrelevant-for-this-test',
      })
    );
    userId = user.id;
  });

  async function createProduct(preferredShopId: string) {
    const product = await AppDataSource.manager.save(
      AppDataSource.manager.create(Product, {
        name: 'Klopapier',
        categoryId: CATEGORY_ID,
        preferredShopId,
      })
    );
    return product;
  }

  async function createOpenWish(productId: string) {
    const wish = await AppDataSource.manager.save(
      AppDataSource.manager.create(Wish, {
        productId,
        createdById: userId,
        status: 'open',
      })
    );
    return wish;
  }

  async function readWishRow(id: string) {
    const rows = await AppDataSource.query(
      'SELECT status, "assignedTripStopId" FROM wishes WHERE id = $1',
      [id]
    );
    return rows[0] as { status: string; assignedTripStopId: string | null };
  }

  it('assigns a wish to a stop at a shop other than its preferred one', async () => {
    const product = await createProduct(REWE_SHOP_ID);
    const wish = await createOpenWish(product.id);

    const trip = await tripService.create(userId, [
      { shopId: ALDI_SHOP_ID, wishIds: [wish.id] },
    ]);
    const stopId = trip.stops[0].id;

    const row = await readWishRow(wish.id);
    expect(row.status).toBe('onTrip');
    // This is exactly what used to fail: the wish stayed unassigned (or
    // pointed at a stale stop) whenever the target shop differed from the
    // product's own preferred shop.
    expect(row.assignedTripStopId).toBe(stopId);
  });

  it('fully clears the stop assignment when a stop is skipped', async () => {
    const product = await createProduct(REWE_SHOP_ID);
    const wish = await createOpenWish(product.id);

    const trip = await tripService.create(userId, [
      { shopId: ALDI_SHOP_ID, wishIds: [wish.id] },
    ]);
    const stopId = trip.stops[0].id;

    // "Markt auslassen": every wish on the stop is reported as not found.
    await tripService.completeStop(trip.id, stopId, [wish.id]);

    const row = await readWishRow(wish.id);
    expect(row.status).toBe('open');
    // The bug: this stayed set to the now-done stop's id instead of NULL,
    // silently orphaning the wish.
    expect(row.assignedTripStopId).toBeNull();
  });

  it('is idempotent: plan -> move to a different shop -> abort all stops -> back to the original 1 open wish, no leftovers', async () => {
    const product = await createProduct(REWE_SHOP_ID);
    const wish = await createOpenWish(product.id);

    const trip = await tripService.create(userId, [
      { shopId: ALDI_SHOP_ID, wishIds: [wish.id] },
    ]);
    await tripService.completeStop(trip.id, trip.stops[0].id, [wish.id]);

    const row = await readWishRow(wish.id);
    expect(row.status).toBe('open');
    expect(row.assignedTripStopId).toBeNull();

    // Nothing else should have been left behind at the data level.
    const wishCount = await AppDataSource.query('SELECT count(*)::int FROM wishes');
    expect(wishCount[0].count).toBe(1);
  });

  it('re-planning the same wish to its default shop afterwards works cleanly (no stale prior assignment)', async () => {
    const product = await createProduct(REWE_SHOP_ID);
    const wish = await createOpenWish(product.id);

    const firstTrip = await tripService.create(userId, [
      { shopId: ALDI_SHOP_ID, wishIds: [wish.id] },
    ]);
    await tripService.completeStop(firstTrip.id, firstTrip.stops[0].id, [wish.id]);

    const secondTrip = await tripService.create(userId, [
      { shopId: REWE_SHOP_ID, wishIds: [wish.id] },
    ]);
    const secondStopId = secondTrip.stops[0].id;

    const row = await readWishRow(wish.id);
    expect(row.status).toBe('onTrip');
    expect(row.assignedTripStopId).toBe(secondStopId);
  });
});

describe('product preferred shop assignment', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.query('TRUNCATE TABLE wishes, products RESTART IDENTITY CASCADE');
  });

  it('persists a changed preferred shop instead of silently keeping the old one', async () => {
    const productService = new ProductService();
    const product = await AppDataSource.manager.save(
      AppDataSource.manager.create(Product, {
        name: 'Katzenstreu',
        categoryId: CATEGORY_ID,
        preferredShopId: REWE_SHOP_ID,
      })
    );

    // getById() (used internally by update()) eager-loads the old
    // preferredShop relation object - that's exactly the situation the fix
    // has to survive.
    await productService.update(product.id, { preferredShopId: ALDI_SHOP_ID });

    const rows = await AppDataSource.query(
      'SELECT "preferredShopId" FROM products WHERE id = $1',
      [product.id]
    );
    expect(rows[0].preferredShopId).toBe(ALDI_SHOP_ID);
  });

  it('changes only the category, leaving the preferred shop untouched', async () => {
    const productService = new ProductService();
    const OTHER_CATEGORY_ID = '22222222-2222-4222-8222-222222222222';
    const product = await AppDataSource.manager.save(
      AppDataSource.manager.create(Product, {
        name: 'Katzenstreu',
        categoryId: CATEGORY_ID,
        preferredShopId: REWE_SHOP_ID,
      })
    );

    await productService.update(product.id, { categoryId: OTHER_CATEGORY_ID });

    const rows = await AppDataSource.query(
      'SELECT "categoryId", "preferredShopId" FROM products WHERE id = $1',
      [product.id]
    );
    expect(rows[0].categoryId).toBe(OTHER_CATEGORY_ID);
    expect(rows[0].preferredShopId).toBe(REWE_SHOP_ID);
  });
});

describe('login with name, optional email', () => {
  let authService: AuthService;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    authService = new AuthService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  });

  it('registers and logs in with name + password, no email required', async () => {
    await authService.register('Kiddo One', 'password123');

    const result = await authService.login('Kiddo One', 'password123');
    expect(result.user.name).toBe('Kiddo One');
    expect(result.user.email).toBeFalsy();
  });

  it('rejects a duplicate name', async () => {
    await authService.register('Kiddo One', 'password123');

    await expect(authService.register('Kiddo One', 'password456')).rejects.toThrow();
  });

  it('allows two users with no email at all - unique still holds only for actually-given emails', async () => {
    await authService.register('Kiddo One', 'password123');
    await authService.register('Kiddo Two', 'password456');

    const rows = await AppDataSource.query('SELECT name, email FROM users ORDER BY name');
    expect(rows).toEqual([
      { name: 'Kiddo One', email: null },
      { name: 'Kiddo Two', email: null },
    ]);
  });

  it('still rejects a duplicate email when one is actually provided', async () => {
    await authService.register('Kiddo One', 'password123', 'family@example.com');

    await expect(
      authService.register('Kiddo Two', 'password456', 'family@example.com')
    ).rejects.toThrow();
  });
});

describe('self-service: updateMe (own data maintenance)', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    authService = new AuthService();
    userService = new UserService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  });

  it('changes the email alone, no password needed', async () => {
    const { user } = await authService.register('Kiddo One', 'password123');

    const updated = await userService.updateMe(user.id, { email: 'new@example.com' });
    expect(updated.email).toBe('new@example.com');

    // Login still works with the unchanged password.
    await expect(authService.login('Kiddo One', 'password123')).resolves.toBeTruthy();
  });

  it('changes the password only with a correct current password, and the new one then works', async () => {
    const { user } = await authService.register('Kiddo One', 'password123');

    await userService.updateMe(user.id, {
      currentPassword: 'password123',
      newPassword: 'password456',
    });

    await expect(authService.login('Kiddo One', 'password456')).resolves.toBeTruthy();
    await expect(authService.login('Kiddo One', 'password123')).rejects.toThrow();
  });

  it('rejects a password change with a wrong current password, leaving the old one intact', async () => {
    const { user } = await authService.register('Kiddo One', 'password123');

    await expect(
      userService.updateMe(user.id, {
        currentPassword: 'wrong-password',
        newPassword: 'password456',
      })
    ).rejects.toThrow();

    await expect(authService.login('Kiddo One', 'password123')).resolves.toBeTruthy();
  });

  it('rejects changing the email to one already used by someone else', async () => {
    await authService.register('Kiddo One', 'password123', 'taken@example.com');
    const { user: kiddoTwo } = await authService.register('Kiddo Two', 'password456');

    await expect(
      userService.updateMe(kiddoTwo.id, { email: 'taken@example.com' })
    ).rejects.toThrow();
  });
});