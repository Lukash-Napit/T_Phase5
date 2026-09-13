import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty({ message: 'text is required' })
  text: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
