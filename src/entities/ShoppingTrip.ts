import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from './User';
import { TripStop } from './TripStop';

@Entity('shopping_trips')
export class ShoppingTrip {
  @PrimaryColumn('uuid')
  id = uuid();

  @Column('uuid')
  startedById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'startedById' })
  startedBy!: User;

  @Column('enum', { enum: ['active', 'done'] })
  status!: 'active' | 'done';

  @CreateDateColumn()
  startedAt!: Date;

  @OneToMany(() => TripStop, (stop) => stop.trip, { cascade: true, eager: true })
  stops!: TripStop[];
}
