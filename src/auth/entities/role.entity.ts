import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RoleType } from '../../common/enums/role.enum';
import { UserRole } from './user-role.entity';

@Entity({
    schema: 'auth',
    name: 'roles',
})
export class Role extends BaseEntity {
    @Column({
        type: 'enum',
        enum: RoleType,
        unique: true,
    })
    name: RoleType;

    @Column({
        nullable: true,
        length: 255,
    })
    description?: string;

    @OneToMany(() => UserRole, (userRole) => userRole.role)
    userRoles: UserRole[];
}