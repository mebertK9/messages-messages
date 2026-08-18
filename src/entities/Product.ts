import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Shop } from './Shop';
import { Wish } from './Wish';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('text')
  name: string;

  @Column('uuid', { nullable: true })
  preferredShopId?: string;

  @ManyToOne(() => Shop, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'preferredShopId' })
  preferredShop?: Shop | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Wish, (wish) => wish.product)
  wishes: Wish[];
}
