import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b6f805e2-ade2-4e51-9850-7de4df3db3b5',
    description:
      'Example task UUID; replace it with an ID from a real response.',
  })
  id: string;
  @ApiProperty({ example: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10' })
  userId: string;
  @ApiProperty({ example: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a' })
  categoryId: string;
  @ApiProperty({ example: 'Prepare project proposal' }) taskName: string;
  @ApiProperty({ nullable: true, example: 'Draft the outline and budget.' })
  description: string | null;
  @ApiProperty({ enum: ['ACTIVE', 'COMPLETED'], example: 'ACTIVE' }) status:
    'ACTIVE' | 'COMPLETED';
  @ApiProperty({ format: 'date-time', example: '2026-11-21T10:00:00.000Z' })
  createdAt: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-21T10:00:00.000Z' })
  updatedAt: string;
}

export class CategoryResponseDto {
  @ApiProperty({ example: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a' }) id: string;
  @ApiProperty({ example: 'Personal' }) name: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-21T10:00:00.000Z' })
  createdAt: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10' }) id: string;
  @ApiProperty({ example: 'padma_test' }) username: string;
}

export class AuthSessionResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature',
    description:
      'Copy the actual token from the login response into Swagger Authorize. The example token is not valid.',
  })
  accessToken: string;
  @ApiProperty({ type: AuthUserResponseDto }) user: AuthUserResponseDto;
}

export class ProfileResponseDto {
  @ApiProperty({ nullable: true, example: 'Taylor Example' }) name:
    string | null;
  @ApiProperty({ nullable: true, example: 30 }) age: number | null;
  @ApiProperty({ nullable: true, example: 'Designer' }) profession:
    string | null;
  @ApiProperty({ example: 'testuser' }) username: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Logged out' }) message: string;
}
