import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  // bodyParser propio para subir el límite (fotos en base64 antes de Storage).
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  const config = app.get(ConfigService<AppConfig, true>);

  app.setGlobalPrefix('api');

  const corsOrigins = config.get('corsOrigins', { infer: true });
  app.enableCors({ origin: corsOrigins, credentials: true });
  // eslint-disable-next-line no-console
  console.log('🌐 CORS — orígenes permitidos:', corsOrigins);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🎟  API escuchando en http://localhost:${port}/api`);
}

void bootstrap();
