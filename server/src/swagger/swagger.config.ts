import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = () => ({
  route: process.env.SWAGGER_ROUTE ?? '/docs',
  enabled: true,
  document: new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE ?? 'PathMinded API')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION ??
        'API documentation for PathMinded backend',
    )
    .setVersion(process.env.SWAGGER_VERSION ?? '1.0.0')
    .build(),
});
