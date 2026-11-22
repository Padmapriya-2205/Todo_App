import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Taylor Example', description: 'Display name.' }) @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 150, description: 'Age in years.' }) @IsOptional() @IsInt() @Min(1) @Max(150) age?: number;
  @ApiPropertyOptional({ example: 'Designer', description: 'Profession or job title.' }) @IsOptional() @IsString() profession?: string;
}
