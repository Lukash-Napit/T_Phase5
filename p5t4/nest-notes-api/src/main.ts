// ============================================================
// main.ts
// Registers the global ValidationPipe -- WITHOUT this line, the
// DTO decorators do nothing at all; they're inert metadata until
// a pipe actually reads and enforces them.
// ============================================================

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unexpected fields instead of silently allowing them through
      forbidNonWhitelisted: true, // reject (400) if extra unexpected fields are present, rather than silently dropping them
    })
  );

  await app.listen(3000);
  console.log('NestJS Notes API running on port 3000');
}

bootstrap();
