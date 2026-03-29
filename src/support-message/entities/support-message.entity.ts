import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';


export enum SupportMessageStatus {
  SENT = 'sent',
  UNREAD = 'unread',
  READ = 'read',
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  supporterId: number;

  @Column({
    type: 'enum',
    enum: SupportMessageStatus,
    default: SupportMessageStatus.SENT,
  })
  status: SupportMessageStatus;

  @Column({ type: 'text' })
  messageText: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.supportMessagesAsUser)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (user) => user.supportMessagesAsSupporter)
  @JoinColumn({ name: 'supporterId' })
  supporter: User;
}
