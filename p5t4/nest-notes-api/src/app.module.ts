// ============================================================
// app.module.ts
// Wires the LoggingMiddleware to run on every route.
// ============================================================

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { NotesModule } from './notes.module';
import { LoggingMiddleware } from './logging.middleware';

@Module({
  imports: [NotesModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
