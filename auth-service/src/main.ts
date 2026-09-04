import { initTracing } from '@platform/tracing';

// Must be called BEFORE any other imports to auto-instrument HTTP/DB calls
initTracing({ serviceName: 'auth-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { AllExceptionsFilter, TransformInterceptor } from '@platform/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Authentication Service API')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,       // Auto-transform to DTO class instances
      exceptionFactory: (errors) => {
        // Convert class-validator errors to our API contract format
        const fieldErrors: Record<string, string[]> = {};

        errors.forEach((error) => {
          if (error.property && error.constraints) {
            fieldErrors[error.property] = Object.values(error.constraints);
          }
        });

        return new BadRequestException({
          message: 'Thông tin đầu vào không hợp lệ',
          errors: fieldErrors,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: appConfig.CORS_ORIGIN,
    credentials: true,
  });

  await app.listen(appConfig.PORT, '0.0.0.0');
  console.log(`[auth-service] Listening on port ${appConfig.PORT}`);
}

bootstrap();
