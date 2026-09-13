// ============================================================
// notes.module.ts
// Declares that NotesController and NotesService belong
// together. This registration is what makes NestJS's DI
// container aware that NotesService exists and is available to
// be injected -- forgetting to list it here is the single most
// common "dependency resolution" error beginners hit.
// ============================================================

import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
