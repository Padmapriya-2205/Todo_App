import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
export class CreateTaskDto {
  @ApiProperty({
    example: 'Complete backend implementation',
    description:
      'Required task title; 1-255 characters and must contain a non-whitespace character.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/\S/)
  taskName: string;
  @ApiPropertyOptional({
    example: 'Finish the task management API and write unit tests.',
    description: 'Optional task description. Empty strings are allowed.',
  })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({
    format: 'uuid',
    example: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
    description:
      'Required UUID of an existing category. This is an example; use an ID returned by GET /categories.',
  })
  @IsUUID()
  categoryId: string;
}
export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Updated backend implementation',
    description:
      'Optional updated title; 1–255 characters and must contain a non-whitespace character.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/\S/)
  taskName?: string;
  @ApiPropertyOptional({
    example: 'Updated task description.',
    description: 'Optional updated description. Empty strings are allowed.',
  })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiPropertyOptional({
    format: 'uuid',
    example: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
    description:
      'Optional UUID of an existing category; use an ID returned by GET /categories.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
export class UpdateStatusDto {
  @ApiProperty({
    enum: ['ACTIVE', 'COMPLETED'],
    example: 'COMPLETED',
    description: 'Task completion state.',
  })
  @IsEnum(['ACTIVE', 'COMPLETED'])
  status: 'ACTIVE' | 'COMPLETED';
}
export class GetTasksQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
    description:
      'Optional category UUID filter; use an ID returned by GET /categories.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'COMPLETED'],
    example: 'ACTIVE',
    description:
      'Optional task status filter. This API does not implement pagination.',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'COMPLETED'])
  status?: 'ACTIVE' | 'COMPLETED';
}
