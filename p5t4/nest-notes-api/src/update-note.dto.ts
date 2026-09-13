// ============================================================
// update-note.dto.ts
// Derived from CreateNoteDto via PartialType -- every field
// becomes optional, but the underlying validation rules (e.g.
// text, when present, must still be a non-empty string) stay
// identical and automatically stay in sync if CreateNoteDto
// ever changes. This is the exact same idea as TypeScript's
// Partial<T> utility type from Phase 3, just applied to a
// validation-decorated class instead of a plain interface.
// ============================================================

import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
