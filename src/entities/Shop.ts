import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Product } from './Product';
import { TripStop } from './TripStop';

@Entity('shops')
export class Shop {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('text')
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Product, (product) => product.preferredShop)
  products: Product[];

  @OneToMany(() => TripStop, (stop) => stop.shop)
  stops: TripStop[];
}
