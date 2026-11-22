import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  GetTasksQueryDto,
  UpdateTaskDto,
  UpdateStatusDto,
} from './tasks.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { TaskResponseDto } from '../common/api-response.dto';

const taskExample = {
  id: 'b6f805e2-ade2-4e51-9850-7de4df3db3b5',
  userId: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10',
  categoryId: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
  taskName: 'Complete backend implementation',
  description: 'Finish the task management API and write unit tests.',
  status: 'ACTIVE',
  createdAt: '2026-11-21T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
};

const secondTaskExample = {
  ...taskExample,
  id: '4b9f1fb4-8282-4dcf-8913-2a6d549e3ec4',
  taskName: 'Review API documentation',
  description: 'Check the manual testing workflow in Swagger.',
  status: 'COMPLETED',
};

@ApiTags('Tasks')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @ApiOperation({
    summary: 'Create a task',
    description:
      'Creates a task for the authenticated user. First call GET /categories and use an existing category ID.',
  })
  @ApiBody({
    type: CreateTaskDto,
    description:
      'Task name and existing category UUID are required; description is optional.',
  })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.sub, dto);
  }

  @ApiOperation({
    summary: 'List the authenticated user’s tasks',
    description:
      'Lists tasks owned by the current authenticated user. The user ID comes from the Bearer token; categoryId and status are optional filters. Results are ordered by creation time. Pagination is not implemented.',
  })
  @ApiOkResponse({
    description: 'Tasks matching the filters.',
    type: TaskResponseDto,
    isArray: true,
    example: [taskExample, secondTaskExample],
  })
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: GetTasksQueryDto) {
    return this.tasks.findAll(user.sub, query.categoryId, query.status);
  }

  @ApiOperation({
    summary: 'Get a task',
    description:
      'Returns a task only when it exists and belongs to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'The requested task.',
    type: TaskResponseDto,
    example: taskExample,
  })
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.findOne(user.sub, id);
  }

  @ApiOperation({
    summary: 'Update a task',
    description:
      'Partially updates an owned task. Omit any fields you do not want to change.',
  })
  @ApiBody({
    type: UpdateTaskDto,
    description: 'All fields are optional; send only the fields to update.',
  })
  @ApiOkResponse({
    description: 'Updated task.',
    type: TaskResponseDto,
    example: {
      ...taskExample,
      taskName: 'Updated backend implementation',
      description: 'Updated task description.',
      updatedAt: '2026-11-22T10:00:00.000Z',
    },
  })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user.sub, id, dto);
  }

  @ApiOperation({
    summary: 'Update task status',
    description: 'Sets the task status to ACTIVE or COMPLETED.',
  })
  @ApiBody({
    type: UpdateStatusDto,
    description: 'The status must be ACTIVE or COMPLETED.',
  })
  @ApiOkResponse({
    description: 'Updated task.',
    type: TaskResponseDto,
    example: {
      ...taskExample,
      status: 'COMPLETED',
      updatedAt: '2026-11-22T10:00:00.000Z',
    },
  })
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tasks.updateStatus(user.sub, id, dto);
  }

  @ApiOperation({
    summary: 'Delete a task',
    description: 'Deletes an owned task. A repeated deletion returns 404.',
  })
  @HttpCode(204)
  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.tasks.delete(user.sub, id);
  }

  @ApiOperation({
    summary: 'Clear tasks in a category',
    description:
      'Deletes the authenticated user’s tasks in the specified existing category.',
  })
  @HttpCode(204)
  @Delete('category/:categoryId')
  async clearCategory(
    @CurrentUser() user: AuthUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    await this.tasks.clearCategory(user.sub, categoryId);
  }
}
