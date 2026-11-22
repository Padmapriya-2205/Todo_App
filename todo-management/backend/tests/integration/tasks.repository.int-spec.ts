import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../src/database/schema';
import { TasksRepository } from '../../src/tasks/tasks.repository';
import { createIsolatedPostgresDatabase, IsolatedPostgresDatabase } from './postgres-test-database';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithTestDatabase = databaseUrl ? describe : describe.skip;

describeWithTestDatabase('TasksRepository PostgreSQL integration', () => {
  let database: IsolatedPostgresDatabase;
  let repository: TasksRepository;
  let userId: string;
  let otherUserId: string;
  let categoryId: string;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required for repository integration tests.');
    database = await createIsolatedPostgresDatabase(databaseUrl);
    await database.pool.query("INSERT INTO users (username, password_hash) VALUES ('owner', 'hash'), ('other', 'hash') RETURNING id")
      .then(({ rows }) => { [userId, otherUserId] = rows.map((row: { id: string }) => row.id); });
    await database.pool.query("INSERT INTO categories (name) VALUES ('Personal') RETURNING id")
      .then(({ rows }) => { categoryId = rows[0].id as string; });
    repository = new TasksRepository(drizzle(database.pool, { schema }) as never);
  });

  afterAll(async () => {
    await database?.close();
  });

  it('creates, reads, filters, partially updates, and deletes tasks in PostgreSQL', async () => {
    // ARRANGE
    const created = await repository.createTask(userId, {
      taskName: 'Prepare proposal',
      description: 'Outline',
      categoryId,
    });

    // ACT
    const userTasks = await repository.findAllByUserId(userId, categoryId, 'ACTIVE');
    const updated = await repository.updateTask(created.id, userId, { description: 'Revised outline' });
    const deleted = await repository.deleteTask(created.id, userId);

    // ASSERT
    expect(created).toMatchObject({ userId, categoryId, status: 'ACTIVE', description: 'Outline' });
    expect(userTasks).toHaveLength(1);
    expect(updated).toMatchObject({ taskName: 'Prepare proposal', description: 'Revised outline' });
    expect(deleted).toBe(true);
    await expect(repository.findByIdAndUserId(created.id, userId)).resolves.toBeNull();
  });

  it('enforces user ownership and database foreign-key constraints', async () => {
    // ARRANGE
    const created = await repository.createTask(userId, { taskName: 'Owned task', categoryId });

    // ACT
    const otherUserTask = await repository.findByIdAndUserId(created.id, otherUserId);
    const otherUserDelete = await repository.deleteTask(created.id, otherUserId);

    // ASSERT
    expect(otherUserTask).toBeNull();
    expect(otherUserDelete).toBe(false);
    await expect(repository.createTask('00000000-0000-0000-0000-000000000000', {
      taskName: 'Invalid owner task',
      categoryId,
    })).rejects.toMatchObject({ code: '23503' });
  });

  it('cascades user deletion and restricts category deletion while tasks exist', async () => {
    // ARRANGE
    const created = await repository.createTask(userId, { taskName: 'Cascade task', categoryId });

    // ACT / ASSERT
    await expect(database.pool.query('DELETE FROM categories WHERE id = $1', [categoryId]))
      .rejects.toMatchObject({ code: '23503' });
    await database.pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await expect(repository.findByIdAndUserId(created.id, userId)).resolves.toBeNull();
  });
});
