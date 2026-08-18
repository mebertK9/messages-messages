import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Wish } from './Wish';
import { User } from './User';

@Entity('notifications')
@Index(['recipientId', 'read'])
export class Notification {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('uuid')
  wishId!: string;

  @ManyToOne(() => Wish, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'wishId' })
  wish!: Wish;

  @Column('uuid')
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @Column('enum', { enum: ['wishOnTrip', 'wishAddedToActiveTrip', 'wishRetracted', 'wishNotFound'] })
  type!: 'wishOnTrip' | 'wishAddedToActiveTrip' | 'wishRetracted' | 'wishNotFound';

  @Column('boolean', { default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
