import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from '../common/api-response.dto';
@ApiTags('Categories')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @ApiOperation({
    summary: 'List task categories',
    description:
      'Returns existing categories. Use an ID from this response in task requests; this API does not provide a category-creation endpoint.',
  })
  @ApiOkResponse({
    description:
      'Existing categories. Example IDs are illustrative; use an ID returned by this operation.',
    type: CategoryResponseDto,
    isArray: true,
    example: [
      {
        id: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
        name: 'Personal',
        createdAt: '2026-11-21T10:00:00.000Z',
      },
      {
        id: 'dfbd62eb-fbd9-43eb-9b83-2ee0fedb68bc',
        name: 'Work',
        createdAt: '2026-11-21T10:00:00.000Z',
      },
    ],
  })
  @Get()
  findAll() {
    return this.categories.findAll();
  }
}
