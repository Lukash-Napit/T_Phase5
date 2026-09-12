import { Module } from '@nestjs/common';
import { NotesModule } from './notes.module';

@Module({
  imports: [NotesModule],
})
export class AppModule {}
