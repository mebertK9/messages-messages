import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Wish } from './Wish';
import { ShoppingTrip } from './ShoppingTrip';
import { Notification } from './Notification';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('text', { unique: true })
  name!: string;

  @Column('text', { unique: true, nullable: true })
  email?: string | null;

  @Column('text', { select: false })
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Wish, (wish) => wish.createdBy)
  wishes!: Wish[];

  @OneToMany(() => ShoppingTrip, (trip) => trip.startedBy)
  trips!: ShoppingTrip[];

  @OneToMany(() => Notification, (notif) => notif.recipient)
  notifications!: Notification[];
}
