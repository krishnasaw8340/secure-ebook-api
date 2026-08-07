import {
    Entity,
    ManyToOne,
    JoinColumn,
    Unique,
    Column,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity({
    schema: 'auth',
    name: 'user_roles',
})
@Unique(['user', 'role'])
export class UserRole extends BaseEntity {
    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    userId: string;

    @Column({
        name: 'role_id',
        type: 'uuid',
    })
    roleId: string;

    @ManyToOne(() => User, (user) => user.userRoles, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'user_id',
    })
    user: User;

    @ManyToOne(() => Role, (role) => role.userRoles, {
        nullable: false,
    })
    @JoinColumn({
        name: 'role_id',
    })
    role: Role;

    @Column({
        name: 'assigned_at',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    assignedAt: Date;
}