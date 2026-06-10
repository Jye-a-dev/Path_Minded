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
  app.enableCors({
    origin: true,
    credentials: true,
  });
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

    try {
      const pool = app.get<Pool>(DB_PROVIDER.PG_POOL);
      const keyMap: Record<string, { values: string[]; description: string }> =
        {};

      const [
        programsRes,
        classesRes,
        advisorsRes,
        studentsRes,
        usersRes,
        curriculumImportsRes,
        transcriptUploadsRes,
        exportsRes,
      ] = await Promise.all([
        pool
          .query<{
            id: string;
            program_code: string;
            program_name: string;
          }>(
            'SELECT id, program_code, program_name FROM programs ORDER BY program_code',
          )
          .catch(() => ({
            rows: [] as Array<{
              id: string;
              program_code: string;
              program_name: string;
            }>,
          })),
        pool
          .query<{
            id: string;
            class_code: string;
            class_name: string;
          }>(
            'SELECT id, class_code, class_name FROM classes ORDER BY class_code',
          )
          .catch(() => ({
            rows: [] as Array<{
              id: string;
              class_code: string;
              class_name: string;
            }>,
          })),
        pool
          .query<{
            id: string;
            full_name: string;
          }>('SELECT id, full_name FROM advisors ORDER BY full_name')
          .catch(() => ({
            rows: [] as Array<{ id: string; full_name: string }>,
          })),
        pool
          .query<{
            id: string;
            student_code: string;
            full_name: string;
          }>(
            'SELECT id, student_code, full_name FROM students ORDER BY student_code',
          )
          .catch(() => ({
            rows: [] as Array<{
              id: string;
              student_code: string;
              full_name: string;
            }>,
          })),
        pool
          .query<{
            id: string;
            email: string;
          }>('SELECT id, email FROM users ORDER BY email')
          .catch(() => ({ rows: [] as Array<{ id: string; email: string }> })),
        pool
          .query<{
            id: string;
            file_name: string;
          }>('SELECT id, file_name FROM curriculum_imports ORDER BY file_name')
          .catch(() => ({
            rows: [] as Array<{ id: string; file_name: string }>,
          })),
        pool
          .query<{
            id: string;
            student_id: string;
          }>('SELECT id, student_id FROM transcript_uploads ORDER BY id')
          .catch(() => ({
            rows: [] as Array<{ id: string; student_id: string }>,
          })),
        pool
          .query<{
            id: string;
            file_name: string;
          }>('SELECT id, file_name FROM exports ORDER BY file_name')
          .catch(() => ({
            rows: [] as Array<{ id: string; file_name: string }>,
          })),
      ]);

      if (programsRes.rows.length > 0) {
        keyMap['program_id'] = {
          values: programsRes.rows.map((r) => r.id),
          description: programsRes.rows
            .map((r) => `${r.id} (${r.program_code} - ${r.program_name})`)
            .join(', '),
        };
      }
      if (classesRes.rows.length > 0) {
        keyMap['class_id'] = {
          values: classesRes.rows.map((r) => r.id),
          description: classesRes.rows
            .map(
              (r) => `${r.id} (${r.class_code} - ${r.class_name || 'No Name'})`,
            )
            .join(', '),
        };
      }
      if (advisorsRes.rows.length > 0) {
        keyMap['advisor_id'] = {
          values: advisorsRes.rows.map((r) => r.id),
          description: advisorsRes.rows
            .map((r) => `${r.id} (${r.full_name})`)
            .join(', '),
        };
      }
      if (studentsRes.rows.length > 0) {
        keyMap['student_id'] = {
          values: studentsRes.rows.map((r) => r.id),
          description: studentsRes.rows
            .map((r) => `${r.id} (${r.student_code} - ${r.full_name})`)
            .join(', '),
        };
      }
      if (usersRes.rows.length > 0) {
        keyMap['user_id'] = {
          values: usersRes.rows.map((r) => r.id),
          description: usersRes.rows
            .map((r) => `${r.id} (${r.email})`)
            .join(', '),
        };
      }
      if (curriculumImportsRes.rows.length > 0) {
        keyMap['import_id'] = {
          values: curriculumImportsRes.rows.map((r) => r.id),
          description: curriculumImportsRes.rows
            .map((r) => `${r.id} (${r.file_name})`)
            .join(', '),
        };
      }
      if (transcriptUploadsRes.rows.length > 0) {
        keyMap['upload_id'] = {
          values: transcriptUploadsRes.rows.map((r) => r.id),
          description: transcriptUploadsRes.rows
            .map((r) => `${r.id} (For Student ID: ${r.student_id})`)
            .join(', '),
        };
      }
      if (exportsRes.rows.length > 0) {
        keyMap['export_id'] = {
          values: exportsRes.rows.map((r) => r.id),
          description: exportsRes.rows
            .map((r) => `${r.id} (${r.file_name})`)
            .join(', '),
        };
      }

      const injectEnums = (obj: unknown, map: typeof keyMap) => {
        if (!obj || typeof obj !== 'object') return;
        const record = obj as Record<string, unknown>;
        for (const key of Object.keys(record)) {
          const val = record[key];
          if (val && typeof val === 'object') {
            const valRecord = val as Record<string, unknown>;
            if (
              typeof valRecord.name === 'string' &&
              map[valRecord.name] &&
              valRecord.schema &&
              typeof valRecord.schema === 'object'
            ) {
              const schemaRecord = valRecord.schema as Record<string, unknown>;
              schemaRecord.enum = map[valRecord.name].values;
              const currentDesc = (schemaRecord.description ||
                valRecord.description ||
                '') as string;
              schemaRecord.description =
                `${currentDesc}\n\nAllowed values: ${map[valRecord.name].description}`.trim();
              valRecord.description = schemaRecord.description;
            }
            if (map[key] && (valRecord.type === 'string' || !valRecord.type)) {
              valRecord.enum = map[key].values;
              const currentDesc = (valRecord.description || '') as string;
              valRecord.description =
                `${currentDesc}\n\nAllowed values: ${map[key].description}`.trim();
            }
            injectEnums(val, map);
          }
        }
      };

      injectEnums(document, keyMap);
    } catch (e) {
      logger.error('Failed to load foreign keys for Swagger dropdowns', e);
    }

    // Apply bearer auth globally to all endpoints
    document.security = [{ 'access-token': [] }];

    SwaggerModule.setup(swagger.route, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
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
