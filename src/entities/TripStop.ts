import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ShoppingTrip } from './ShoppingTrip';
import { Shop } from './Shop';
import { Wish } from './Wish';

@Entity('trip_stops')
export class TripStop {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('uuid')
  tripId!: string;

  @ManyToOne(() => ShoppingTrip, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'tripId' })
  trip!: ShoppingTrip;

  @Column('uuid')
  shopId!: string;

  @ManyToOne(() => Shop, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'shopId' })
  shop!: Shop;

  @Column('enum', { enum: ['active', 'done'] })
  status!: 'active' | 'done';

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Wish, (wish) => wish.assignedTripStop)
  wishes!: Wish[];
}
