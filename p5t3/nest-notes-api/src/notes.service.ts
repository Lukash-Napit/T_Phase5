import { Injectable } from '@nestjs/common';

interface Note {
  id: number;
  text: string;
  completed: boolean;
}

@Injectable()
export class NotesService {
  private notes: Note[] = [];
  private nextId = 1;

  findAll(): Note[] {
    return this.notes;
  }

  findOne(id: number): Note | undefined {
    return this.notes.find((note) => note.id === id);
  }

  create(text: string, completed = false): Note {
    const note: Note = { id: this.nextId++, text, completed };
    this.notes.push(note);
    return note;
  }

  update(id: number, changes: Partial<Pick<Note, 'text' | 'completed'>>): Note | undefined {
    const note = this.findOne(id);
    if (!note) return undefined;
    Object.assign(note, changes);
    return note;
  }

  remove(id: number): Note | undefined {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index === -1) return undefined;
    const [removed] = this.notes.splice(index, 1);
    return removed;
  }
}
