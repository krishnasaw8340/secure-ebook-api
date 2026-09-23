import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse cookies (required for HttpOnly refresh_token cookie)
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'Origin',
    ],
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Configure ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Kuroyomi Ebook & Manga API')
    .setDescription(
      'Secure, high-performance, enterprise-grade backend REST API for digital manga, comic, light novel, and ebook reading platforms.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag(
      'Authentication',
      'Dual-token auth, OTP verification, session & password recovery',
    )
    .addTag(
      'Users',
      'User profile management, account settings & password updates',
    )
    .addTag(
      'Series',
      'Franchise series catalog management (CRUD, search, pagination, visibility scoping)',
    )
    .addTag(
      'Volumes',
      'Series volume groupings (CRUD, ordering, visibility scoping)',
    )
    .addTag(
      'Books',
      'Digital books and language editions (CRUD, relations, pricing models, visibility scoping)',
    )
    .addTag(
      'Chapters',
      'Chapter reading items (CRUD, pricing models FREE/PARTIAL_FREE/PAID, sort ordering, visibility scoping)',
    )
    .addTag(
      'Pages',
      'Page scan & image asset management (ordering, batch creation, visibility)',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Kuroyomi API Documentation',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(
    `📖 Swagger documentation is available at: http://localhost:${port}/docs`,
  );
}
void bootstrap();
