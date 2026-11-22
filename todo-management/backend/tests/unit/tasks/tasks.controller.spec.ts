import { TasksController } from '../../../src/tasks/tasks.controller';
import { TasksService } from '../../../src/tasks/tasks.service';

describe('TasksController', () => {
  const user = { sub: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10', username: 'testuser' };
  const taskId = 'b6f805e2-ade2-4e51-9850-7de4df3db3b5';
  const categoryId = '8d8a1b7e-6be2-4c48-b319-125e0bdab14a';
  let tasks: jest.Mocked<TasksService>;
  let controller: TasksController;

  beforeEach(() => {
    tasks = {
      create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(),
      updateStatus: jest.fn(), delete: jest.fn(), clearCategory: jest.fn(),
    } as unknown as jest.Mocked<TasksService>;
    controller = new TasksController(tasks);
  });

  it('creates tasks under the authenticated user and forwards the request DTO', () => {
    const dto = { taskName: 'Plan work', categoryId };
    controller.create(user, dto);
    expect(tasks.create).toHaveBeenCalledWith(user.sub, dto);
  });

  it('lists only the authenticated user’s tasks using supported filters', () => {
    controller.findAll(user, { categoryId, status: 'ACTIVE' });
    expect(tasks.findAll).toHaveBeenCalledWith(user.sub, categoryId, 'ACTIVE');
  });

  it('retrieves an owned task', () => {
    controller.findOne(user, taskId);
    expect(tasks.findOne).toHaveBeenCalledWith(user.sub, taskId);
  });

  it('forwards partial updates without requiring the omitted task fields', () => {
    const dto = { description: 'Description only' };
    controller.update(user, taskId, dto);
    expect(tasks.update).toHaveBeenCalledWith(user.sub, taskId, dto);
  });

  it('updates task completion status', () => {
    const dto = { status: 'COMPLETED' as const };
    controller.updateStatus(user, taskId, dto);
    expect(tasks.updateStatus).toHaveBeenCalledWith(user.sub, taskId, dto);
  });

  it('deletes an owned task', async () => {
    await controller.delete(user, taskId);
    expect(tasks.delete).toHaveBeenCalledWith(user.sub, taskId);
  });

  it('clears only the authenticated user’s category tasks', async () => {
    await controller.clearCategory(user, categoryId);
    expect(tasks.clearCategory).toHaveBeenCalledWith(user.sub, categoryId);
  });
});
