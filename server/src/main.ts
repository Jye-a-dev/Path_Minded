import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import type { Pool } from 'pg';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { DB_PROVIDER } from './constants/app.constant';
import { swaggerConfig } from './swagger/swagger.config';

type ExpressLayer = {
  route?: { path?: string; methods?: Record<string, boolean> };
  name?: string;
  handle?: { stack?: ExpressLayer[] };
};

const logger = new Logger('Bootstrap');

const getRoutes = (
  app: Awaited<ReturnType<typeof NestFactory.create>>,
): string[] => {
  const httpServer = app.getHttpAdapter().getInstance() as {
    _router?: { stack?: ExpressLayer[] };
  };

  const stack = httpServer?._router?.stack ?? [];
  const routes: string[] = [];

  for (const layer of stack) {
    if (layer.route?.path && layer.route.methods) {
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route?.methods?.[method])
        .map((method) => method.toUpperCase())
        .join(', ');

      routes.push(`${methods} ${layer.route.path}`);
    }

    if (layer.name === 'router' && layer.handle?.stack) {
      for (const subLayer of layer.handle.stack) {
        if (subLayer.route?.path && subLayer.route.methods) {
          const methods = Object.keys(subLayer.route.methods)
            .filter((method) => subLayer.route?.methods?.[method])
            .map((method) => method.toUpperCase())
            .join(', ');

          routes.push(`${methods} ${subLayer.route.path}`);
        }
      }
    }
  }

  return [...new Set(routes)].sort();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = envConfig();
  const swagger = swaggerConfig();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (swagger.enabled) {
    const document = SwaggerModule.createDocument(app, swagger.document);
    SwaggerModule.setup(swagger.route, app, document);
  }

  try {
    const pool = app.get<Pool>(DB_PROVIDER.PG_POOL);
    await pool.query('SELECT 1');
    logger.log(
      `PostgreSQL connected: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} as ${env.DB_USER}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`PostgreSQL connect failed: ${message}`);
  }

  await app.listen(env.PORT);

  const baseUrl = await app.getUrl();
  logger.log(`Server running at: ${baseUrl}`);
  if (swagger.enabled) {
    logger.log(`Swagger URL: ${baseUrl}${swagger.route}`);
  }

  const routes = getRoutes(app);
  if (routes.length === 0) {
    logger.warn('No routes discovered from HTTP adapter.');
    return;
  }

  logger.log(`Routes (${routes.length}):`);
  for (const route of routes) {
    logger.log(`- ${route}`);
  }
}
void bootstrap();
