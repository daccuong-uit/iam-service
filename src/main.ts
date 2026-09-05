import { initTracing } from '@daccuong-uit/platform-tracing';

initTracing({ serviceName: 'iam-service' });

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, TransformInterceptor } from '@daccuong-uit/platform-http-common';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const config = new DocumentBuilder()
    .setTitle('IAM Service')
    .setDescription('Identity and access management API')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('profiles')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const fieldErrors: Record<string, string[]> = {};
      errors.forEach((error) => {
        if (error.property && error.constraints) {
          fieldErrors[error.property] = Object.values(error.constraints);
        }
      });
      return new BadRequestException({ message: 'Thông tin đầu vào không hợp lệ', errors: fieldErrors });
    },
  }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: appConfig.CORS_ORIGIN, credentials: true });

  await app.listen(appConfig.PORT, '0.0.0.0');
  console.log(`[iam-service] Listening on port ${appConfig.PORT}`);
}

bootstrap();