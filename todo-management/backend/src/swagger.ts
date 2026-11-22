import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Todo Management API')
    .setDescription(
      'REST API for authentication, profiles, categories, and owned tasks. Login returns an accessToken in its response body; copy that value into Authorize to call protected endpoints. Request and response examples are illustrative. Swagger does not extract a token from the login response.',
    )
    .setVersion('1.0')
    .addTag(
      'Authentication',
      'Register, log in, refresh, and inspect the current user.',
    )
    .addTag(
      'Tasks',
      'Create and manage tasks belonging to the authenticated user.',
    )
    .addTag(
      'Categories',
      'List categories and obtain a real category ID for task requests.',
    )
    .addTag('Profile', 'View and update the authenticated user profile.')
    .addTag('Health', 'Check that the API is responding.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Paste the accessToken from POST /auth/login. Enter the token only; Swagger sends the Authorization: Bearer header.',
      },
      'bearer',
    )
    .addCookieAuth(
      'refreshToken',
      { type: 'apiKey', in: 'cookie' },
      'refreshCookie',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  });
  return document;
}
