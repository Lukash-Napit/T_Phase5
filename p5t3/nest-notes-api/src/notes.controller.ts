import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(Number(id));
  }

  @Post()
  create(@Body() body: { text: string; completed?: boolean }) {
    return this.notesService.create(body.text, body.completed);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { text?: string; completed?: boolean }) {
    return this.notesService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(Number(id));
  }
}
