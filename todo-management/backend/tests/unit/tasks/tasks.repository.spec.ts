import { and, eq } from 'drizzle-orm';
import * as schema from '../../../src/database/schema';
import { TasksRepository } from '../../../src/tasks/tasks.repository';
import { createTaskFixture } from '../../fixtures/task.fixture';

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  and: jest.fn((...conditions: unknown[]) => ({ operator: 'and', conditions })),
  eq: jest.fn((column: unknown, value: unknown) => ({ operator: 'eq', column, value })),
}));

describe('TasksRepository', () => {
  const taskId = 'b6f805e2-ade2-4e51-9850-7de4df3db3b5';
  const userId = '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10';
  const categoryId = '8d8a1b7e-6be2-4c48-b319-125e0bdab14a';
  const task = createTaskFixture({ taskName: 'Plan work', description: null });
  let db: { select: jest.Mock; insert: jest.Mock; update: jest.Mock; delete: jest.Mock };
  let repository: TasksRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
    repository = new TasksRepository(db as never);
  });

  function selectBuilder(result: unknown[]) {
    const builder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(result),
      orderBy: jest.fn().mockResolvedValue(result),
    };
    db.select.mockReturnValue(builder);
    return builder;
  }

  it('inserts a task with the provided owner and the ACTIVE default', async () => {
    // ARRANGE
    const insert = { values: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([task]) };
    db.insert.mockReturnValue(insert);

    // ACT
    const result = await repository.createTask(userId, { taskName: 'Plan work', categoryId });

    // ASSERT
    expect(insert.values).toHaveBeenCalledWith({
      userId, categoryId, taskName: 'Plan work', description: undefined, status: 'ACTIVE',
    });
    expect(result).toEqual(task);
  });

  it('queries only the requested user and applies category and status filters', async () => {
    // ARRANGE
    const builder = selectBuilder([task]);

    // ACT
    const result = await repository.findAllByUserId(userId, categoryId, 'ACTIVE');

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.categoryId, categoryId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.status, 'ACTIVE');
    expect(and).toHaveBeenCalled();
    expect(builder.orderBy).toHaveBeenCalledWith(schema.tasks.createdAt);
    expect(result).toEqual([task]);
  });

  it('returns null when the user does not own the requested task', async () => {
    // ARRANGE
    const builder = selectBuilder([]);

    // ACT
    const result = await repository.findByIdAndUserId(taskId, userId);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.tasks.id, taskId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
    expect(builder.limit).toHaveBeenCalledWith(1);
    expect(result).toBeNull();
  });

  it('updates an owned task using both task and user IDs', async () => {
    // ARRANGE
    const update = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ ...task, description: 'Details' }]),
    };
    db.update.mockReturnValue(update);

    // ACT
    const result = await repository.updateTask(taskId, userId, { description: 'Details' });

    // ASSERT
    expect(update.set).toHaveBeenCalledWith({ description: 'Details', updatedAt: expect.any(Date) });
    expect(eq).toHaveBeenCalledWith(schema.tasks.id, taskId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
    expect(result).toMatchObject({ description: 'Details' });
  });

  it('updates status only for the specified user task', async () => {
    // ARRANGE
    const update = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ ...task, status: 'COMPLETED' }]),
    };
    db.update.mockReturnValue(update);

    // ACT
    await repository.updateTaskStatus(taskId, userId, 'COMPLETED');

    // ASSERT
    expect(update.set).toHaveBeenCalledWith({ status: 'COMPLETED', updatedAt: expect.any(Date) });
    expect(eq).toHaveBeenCalledWith(schema.tasks.id, taskId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
  });

  it('returns false when the scoped delete finds no task', async () => {
    // ARRANGE
    const remove = { where: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([]) };
    db.delete.mockReturnValue(remove);

    // ACT
    const result = await repository.deleteTask(taskId, userId);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.tasks.id, taskId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
    expect(result).toBe(false);
  });

  it('deletes only tasks matching both the owner and category', async () => {
    // ARRANGE
    const remove = { where: jest.fn().mockResolvedValue(undefined) };
    db.delete.mockReturnValue(remove);

    // ACT
    await repository.deleteByUserIdAndCategoryId(userId, categoryId);

    // ASSERT
    expect(eq).toHaveBeenCalledWith(schema.tasks.userId, userId);
    expect(eq).toHaveBeenCalledWith(schema.tasks.categoryId, categoryId);
  });
});
