import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],

            inject: [ConfigService],


            useFactory: (config: ConfigService) => ({
                type: 'postgres',

                host: config.get<string>('database.host'),

                port: config.get<number>('database.port'),

                username: config.get<string>('database.username'),

                password: config.get<string>('database.password'),

                database: config.get<string>('database.database'),

                autoLoadEntities: true,

                synchronize: false,

                logging: config.get<string>('app.env') !== 'production',
            }),
        }),

    ],
})
export class DatabaseModule implements OnApplicationBootstrap {
    private readonly logger = new Logger(DatabaseModule.name);

    constructor(private readonly dataSource: DataSource) {}

    async onApplicationBootstrap() {
        if (this.dataSource.isInitialized) {
            const options = this.dataSource.options as any;
            this.logger.log('────────────────────────────────────────────');
            this.logger.log(`✅ Database Connected successfully!`);
            this.logger.log(`📌 Type     : ${options.type}`);
            this.logger.log(`📌 Host     : ${options.host}`);
            this.logger.log(`📌 Port     : ${options.port}`);
            this.logger.log(`📌 Database : ${options.database}`);
            this.logger.log('────────────────────────────────────────────');
        }
    }
}