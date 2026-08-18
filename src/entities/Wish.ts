import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, Index, JoinColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from './User';
import { Product } from './Product';
import { TripStop } from './TripStop';
import { Notification } from './Notification';

@Entity('wishes')
@Index(['status', 'createdById'])
export class Wish {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column('uuid')
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column('uuid', { nullable: true })
  assignedTripStopId?: string;

  @ManyToOne(() => TripStop, (stop) => stop.wishes, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'assignedTripStopId' })
  assignedTripStop?: TripStop | null;

  @Column('enum', { enum: ['open', 'onTrip', 'purchased', 'cancelled'] })
  status!: 'open' | 'onTrip' | 'purchased' | 'cancelled';

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Notification, (notif) => notif.wish)
  notifications!: Notification[];
}
