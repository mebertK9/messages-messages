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
  email!: string;

  @Column('text')
  name!: string;

  @Column('text')
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
