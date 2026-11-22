import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class LoginDto {
  @ApiProperty({
    example: 'padma_test',
    description: 'Required registered username.',
  })
  @IsString()
  username: string;
  @ApiProperty({
    example: 'Password@123',
    description: 'Required account password.',
  })
  @IsString()
  password: string;
}
