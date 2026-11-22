import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
export class RegisterDto {
  @ApiProperty({
    example: 'padma_test',
    description: 'Required username between 3 and 100 characters.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;
  @ApiProperty({
    example: 'Password@123',
    description: 'Required password between 8 and 255 characters.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;
}
