// ============================================================
// notes.controller.ts
// Now uses DTOs (validated automatically by the global
// ValidationPipe) and throws NestJS's built-in NotFoundException
// for missing notes -- the Nest equivalent of Express's
// next(new NotFoundError(...)).
// ============================================================

import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './create-note.dto';
import { UpdateNoteDto } from './update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const note = this.notesService.findOne(Number(id));
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }

  @Post()
  create(@Body() dto: CreateNoteDto) {
    // dto has ALREADY been validated by the global ValidationPipe
    // by the time this line runs -- if text were missing or empty,
    // this method would never even be called.
    return this.notesService.create(dto.text, dto.completed);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    const note = this.notesService.update(Number(id), dto);
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const note = this.notesService.remove(Number(id));
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }
}
