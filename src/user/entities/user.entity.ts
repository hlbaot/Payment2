import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Wallet } from "../../wallet/entities/wallet.entity";
import { SupportMessage } from "../../support-message/entities/support-message.entity";
import { Order } from "src/order/entities/order.entity";
import { Notification } from "src/notification/entities/notification.entity";
import { Role } from "src/role/entities/role.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150 })
    fullName: string;

    @Column({ unique: true, length: 150 })
    email: string;

    @Column()
    password: string;

    @Column({ type: "text", nullable: true })
    refreshToken: string | null;

    @Column({ unique: true, length: 20, nullable: true })
    phoneNumber: string;

    @Column({ length: 100, nullable: true })
    country: string;
    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToMany(() => Role, { eager: true })
    @JoinTable({
        name: "user_roles",
        joinColumn: { name: "user_id" },
        inverseJoinColumn: { name: "role_id" },
    })
    roleSet: Role[];

    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => SupportMessage, (message) => message.user)
    supportMessagesAsUser: SupportMessage[];

    @OneToMany(() => SupportMessage, (message) => message.supporter)
    supportMessagesAsSupporter: SupportMessage[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];
}
