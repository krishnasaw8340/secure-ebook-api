import { Seeder } from "./seeder.interface";
import { Role } from "../../auth/entities/role.entity";
import { RoleType } from "../../common/enums/role.enum";
import dataSource from "../data-source";

export class RoleSeeder implements Seeder {
    async run(): Promise<void> {
        const roleRepository = dataSource.getRepository(Role);

        const rolesToSeed = [
            { 
                name: RoleType.ADMIN, 
                description: 'Administrator with management access' 
            },
            { 
                name: RoleType.USER, 
                description: 'Standard registered user' 
            },
        ];

        for (const roleData of rolesToSeed) {
            // Check if the role already exists
            const existingRole = await roleRepository.findOne({ 
                where: { name: roleData.name } 
            });

            if (!existingRole) {
                // Insert only the missing ones
                const newRole = roleRepository.create(roleData);
                await roleRepository.save(newRole);
                console.log(`✅ Seeded role: ${roleData.name}`);
            } else {
                console.log(`ℹ️ Role already exists: ${roleData.name}`);
            }
        }
    }
}

// Support running the seed file directly via pnpm seed:roles
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('role.seed.ts'))) {
    (async () => {
        console.log('🌱 Initializing Database for RoleSeeder...');
        await dataSource.initialize();
        try {
            await new RoleSeeder().run();
            console.log('🌱 Seeding completed successfully!');
        } catch (error) {
            console.error('❌ Seeding failed:', error);
        } finally {
            await dataSource.destroy();
        }
    })();
}