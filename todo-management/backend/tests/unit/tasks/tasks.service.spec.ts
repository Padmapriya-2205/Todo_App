import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../../src/categories/categories.service';
import { CreateTaskDto, UpdateStatusDto, UpdateTaskDto } from '../../../src/tasks/tasks.dto';
import { TasksRepository } from '../../../src/tasks/tasks.repository';
import { TasksService } from '../../../src/tasks/tasks.service';
import { createTaskFixture } from '../../fixtures/task.fixture';

describe('TasksService', () => {
  const userId = '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10';
  const otherUserId = 'ba90e578-6cd8-4efb-9887-14faec749839';
  const taskId = 'b6f805e2-ade2-4e51-9850-7de4df3db3b5';
  const categoryId = '8d8a1b7e-6be2-4c48-b319-125e0bdab14a';
  const task = createTaskFixture();
  let repository: jest.Mocked<TasksRepository>;
  let categories: jest.Mocked<Pick<CategoriesService, 'findById'>>;
  let service: TasksService;

  beforeEach(() => {
    // ARRANGE
    repository = {
      createTask: jest.fn(),
      findAllByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updateTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
      deleteByUserIdAndCategoryId: jest.fn(),
    } as unknown as jest.Mocked<TasksRepository>;
    categories = { findById: jest.fn().mockResolvedValue({ id: categoryId }) };
    service = new TasksService(repository, categories as jest.Mocked<CategoriesService>);
  });

  it('creates a task for the authenticated user after validating its category', async () => {
    // ARRANGE
    const dto: CreateTaskDto = { taskName: task.taskName, description: task.description ?? undefined, categoryId };
    repository.createTask.mockResolvedValue(task as never);

    // ACT
    const result = await service.create(userId, dto);

    // ASSERT
    expect(categories.findById).toHaveBeenCalledWith(categoryId);
    expect(repository.createTask).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(task);
  });

  it('does not create a task if its category is missing', async () => {
    // ARRANGE
    const dto: CreateTaskDto = { taskName: task.taskName, categoryId };
    categories.findById.mockRejectedValue(new NotFoundException('Category not found'));

    // ACT / ASSERT
    await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.createTask).not.toHaveBeenCalled();
  });

  it('lists tasks using the authenticated user and optional filters', async () => {
    // ARRANGE
    repository.findAllByUserId.mockResolvedValue([task] as never);

    // ACT
    const result = await service.findAll(userId, categoryId, 'ACTIVE');

    // ASSERT
    expect(repository.findAllByUserId).toHaveBeenCalledWith(userId, categoryId, 'ACTIVE');
    expect(result).toEqual([task]);
  });

  it('returns an empty list when the user has no matching tasks', async () => {
    // ARRANGE
    repository.findAllByUserId.mockResolvedValue([]);

    // ACT
    const result = await service.findAll(userId);

    // ASSERT
    expect(result).toEqual([]);
    expect(repository.findAllByUserId).toHaveBeenCalledWith(userId, undefined, undefined);
  });

  it('retrieves a task using both task ID and owner ID', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(task as never);

    // ACT
    const result = await service.findOne(userId, taskId);

    // ASSERT
    expect(repository.findByIdAndUserId).toHaveBeenCalledWith(taskId, userId);
    expect(result).toEqual(task);
  });

  it('returns 404 if a task is missing or belongs to another user', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.findOne(otherUserId, taskId)).rejects.toThrow(NotFoundException);
    expect(repository.findByIdAndUserId).toHaveBeenCalledWith(taskId, otherUserId);
  });

  it('updates task fields and leaves omitted fields unchanged in the partial DTO', async () => {
    // ARRANGE
    const dto: UpdateTaskDto = { taskName: 'Updated proposal' };
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.updateTask.mockResolvedValue({ ...task, taskName: dto.taskName } as never);

    // ACT
    const result = await service.update(userId, taskId, dto);

    // ASSERT
    expect(repository.updateTask).toHaveBeenCalledWith(taskId, userId, dto);
    expect(result).toMatchObject({ taskName: dto.taskName, description: task.description });
  });

  it('updates only the task description when the title is omitted', async () => {
    // ARRANGE
    const dto: UpdateTaskDto = { description: 'Updated description' };
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.updateTask.mockResolvedValue({ ...task, description: dto.description } as never);

    // ACT
    const result = await service.update(userId, taskId, dto);

    // ASSERT
    expect(repository.updateTask).toHaveBeenCalledWith(taskId, userId, dto);
    expect(result).toMatchObject({ taskName: task.taskName, description: dto.description });
  });

  it('validates a replacement category before updating an owned task', async () => {
    // ARRANGE
    const dto: UpdateTaskDto = { categoryId };
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.updateTask.mockResolvedValue({ ...task, categoryId } as never);

    // ACT
    await service.update(userId, taskId, dto);

    // ASSERT
    expect(categories.findById).toHaveBeenCalledWith(categoryId);
    expect(repository.updateTask).toHaveBeenCalledWith(taskId, userId, dto);
  });

  it('does not update a task that is missing or owned by another user', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(null);
    const dto: UpdateTaskDto = { taskName: 'Changed' };

    // ACT / ASSERT
    await expect(service.update(otherUserId, taskId, dto)).rejects.toThrow(NotFoundException);
    expect(repository.updateTask).not.toHaveBeenCalled();
  });

  it('returns 404 if the owned task disappears before the repository update', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.updateTask.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.update(userId, taskId, { taskName: 'Changed' })).rejects.toThrow(NotFoundException);
  });

  it.each(['ACTIVE', 'COMPLETED'] as const)('sets task status to %s', async (status) => {
    // ARRANGE
    const dto: UpdateStatusDto = { status };
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.updateTaskStatus.mockResolvedValue({ ...task, status } as never);

    // ACT
    const result = await service.updateStatus(userId, taskId, dto);

    // ASSERT
    expect(repository.updateTaskStatus).toHaveBeenCalledWith(taskId, userId, status);
    expect(result).toMatchObject({ status });
  });

  it('does not change status for a task the user does not own', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.updateStatus(otherUserId, taskId, { status: 'COMPLETED' })).rejects.toThrow(NotFoundException);
    expect(repository.updateTaskStatus).not.toHaveBeenCalled();
  });

  it('deletes an owned task', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.deleteTask.mockResolvedValue(true);

    // ACT
    await service.delete(userId, taskId);

    // ASSERT
    expect(repository.deleteTask).toHaveBeenCalledWith(taskId, userId);
  });

  it('does not delete a task that is missing or owned by another user', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(null);

    // ACT / ASSERT
    await expect(service.delete(otherUserId, taskId)).rejects.toThrow(NotFoundException);
    expect(repository.deleteTask).not.toHaveBeenCalled();
  });

  it('returns 404 if the task disappears before deletion', async () => {
    // ARRANGE
    repository.findByIdAndUserId.mockResolvedValue(task as never);
    repository.deleteTask.mockResolvedValue(false);

    // ACT / ASSERT
    await expect(service.delete(userId, taskId)).rejects.toThrow(NotFoundException);
  });

  it('clears only the authenticated user’s tasks in an existing category', async () => {
    // ARRANGE
    categories.findById.mockResolvedValue({ id: categoryId } as never);

    // ACT
    await service.clearCategory(userId, categoryId);

    // ASSERT
    expect(categories.findById).toHaveBeenCalledWith(categoryId);
    expect(repository.deleteByUserIdAndCategoryId).toHaveBeenCalledWith(userId, categoryId);
  });
});
