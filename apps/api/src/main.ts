import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('Bootstrap');

function validateEnvironment(): void {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const accessSecret = process.env['JWT_ACCESS_SECRET'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];

  const insecurePlaceholders = [
    'development_jwt_access_secret_64chars_long_minimum',
    'development_jwt_refresh_secret_64chars_long_minimum',
    'secret',
    'password',
    'changeme',
  ];

  if (isProduction) {
    if (!accessSecret || accessSecret.length < 32 || insecurePlaceholders.includes(accessSecret)) {
      logger.error('CRITICAL: Insecure or missing JWT_ACCESS_SECRET in production. Failing closed.');
      process.exit(1);
    }

    if (!refreshSecret || refreshSecret.length < 32 || insecurePlaceholders.includes(refreshSecret)) {
      logger.error('CRITICAL: Insecure or missing JWT_REFRESH_SECRET in production. Failing closed.');
      process.exit(1);
    }

    if (!process.env['DATABASE_URL']) {
      logger.error('CRITICAL: Missing DATABASE_URL in production. Failing closed.');
      process.exit(1);
    }
  }
}

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Organization-ID',
        'X-Tenant-Code',
        'x-tenant-id',
        'x-user-id',
        'x-user-permissions',
        'X-User-ID',
        'X-User-Permissions',
        'x-user-role',
        'x-authorized-campuses',
        'x-authorized-schools',
        'x-authorized-regions',
        'x-working-context-id',
        'x-working-context-type',
        'x-working-context-name',
      ],
    },
  });

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      frameguard: { action: 'sameorigin' },
      xssFilter: true,
      noSniff: true,
      hidePoweredBy: true,
    })
  );

  // Global sanitized error handler
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful application shutdown...`);
    try {
      await app.close();
      logger.info(`Graceful application shutdown completed for ${signal}`);
      process.exit(0);
    } catch (err) {
      logger.error(`Error during graceful shutdown for ${signal}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const port = process.env['PORT'] || 4000;
  await app.listen(port);
  logger.info(`CampusOS Core API initialized on port ${port}`);
}

bootstrap();

