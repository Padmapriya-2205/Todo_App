import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto, GetTasksQueryDto, UpdateStatusDto, UpdateTaskDto } from '../../../src/tasks/tasks.dto';

describe('Task DTO validation', () => {
  const categoryId = '8d8a1b7e-6be2-4c48-b319-125e0bdab14a';

  it('accepts a valid create payload with optional description', async () => {
    const dto = plainToInstance(CreateTaskDto, { taskName: 'Plan work', categoryId });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects missing task name and category ID', async () => {
    const errors = await validate(plainToInstance(CreateTaskDto, {}));
    expect(errors.map(({ property }) => property)).toEqual(expect.arrayContaining(['taskName', 'categoryId']));
  });

  it('rejects blank, whitespace-only, overlong, and non-string task names', async () => {
    for (const taskName of ['', '   ', 'x'.repeat(256), 42]) {
      expect(await validate(plainToInstance(CreateTaskDto, { taskName, categoryId }))).not.toHaveLength(0);
    }
  });

  it('rejects invalid category IDs and non-string descriptions', async () => {
    expect(await validate(plainToInstance(CreateTaskDto, { taskName: 'Plan work', categoryId: 'invalid' }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(CreateTaskDto, { taskName: 'Plan work', categoryId, description: 12 }))).not.toHaveLength(0);
  });

  it('allows an empty or whitespace-only optional description', async () => {
    for (const description of ['', '   ']) {
      expect(await validate(plainToInstance(CreateTaskDto, { taskName: 'Plan work', categoryId, description }))).toHaveLength(0);
    }
  });

  it('accepts description-only partial updates and rejects invalid title values', async () => {
    expect(await validate(plainToInstance(UpdateTaskDto, { description: 'New details' }))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdateTaskDto, { taskName: '  ' }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(UpdateTaskDto, { categoryId: 'bad-id' }))).not.toHaveLength(0);
  });

  it('accepts only ACTIVE or COMPLETED statuses', async () => {
    expect(await validate(plainToInstance(UpdateStatusDto, { status: 'ACTIVE' }))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdateStatusDto, { status: 'COMPLETED' }))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdateStatusDto, { status: 'PENDING' }))).not.toHaveLength(0);
  });

  it('validates category and status list filters', async () => {
    expect(await validate(plainToInstance(GetTasksQueryDto, { categoryId, status: 'COMPLETED' }))).toHaveLength(0);
    expect(await validate(plainToInstance(GetTasksQueryDto, { categoryId: 'invalid' }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(GetTasksQueryDto, { status: 'PENDING' }))).not.toHaveLength(0);
  });
});
