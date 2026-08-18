import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { Product } from '../entities/Product';
import { Wish } from '../entities/Wish';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { TripStop } from '../entities/TripStop';
import { Notification } from '../entities/Notification';

const isDev = process.env.NODE_ENV !== 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'wishlist',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: isDev,
  entities: [User, Shop, Product, Wish, ShoppingTrip, TripStop, Notification],
  migrations: [isDev ? 'src/migrations/*.ts' : 'dist/migrations/*.js'],
});
