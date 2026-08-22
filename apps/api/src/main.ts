import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: process.env['NODE_ENV'] === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Strict CORS Configuration
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or tools with no origin, or whitelisted domains
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('SECURITY_ERROR: Origin not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID', 'X-Tenant-Code'],
  });

  // 3. Global Error Sanitization Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 4. API Prefix
  app.setGlobalPrefix('api');

  const port = process.env['PORT'] || 4000;
  await app.listen(port);
  logger.info(`CampusOS Core API successfully initialized and listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
