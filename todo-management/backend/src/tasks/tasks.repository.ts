import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.provider';
import * as schema from '../database/schema';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

type Db = NodePgDatabase<typeof schema>;
type Task = typeof schema.tasks.$inferSelect;

@Injectable()
export class TasksRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async createTask(userId: string, dto: CreateTaskDto): Promise<Task> {
    const [task] = await this.db.insert(schema.tasks).values({
      userId,
      categoryId: dto.categoryId,
      taskName: dto.taskName,
      description: dto.description,
      status: 'ACTIVE',
    }).returning();
    return task;
  }

  findAllByUserId(userId: string, categoryId?: string, status?: 'ACTIVE' | 'COMPLETED') {
    const conditions = [eq(schema.tasks.userId, userId)];
    if (categoryId) conditions.push(eq(schema.tasks.categoryId, categoryId));
    if (status) conditions.push(eq(schema.tasks.status, status));
    return this.db.select().from(schema.tasks).where(and(...conditions)).orderBy(schema.tasks.createdAt);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Task | null> {
    const [task] = await this.db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId))).limit(1);
    return task ?? null;
  }

  async updateTask(id: string, userId: string, changes: UpdateTaskDto): Promise<Task | null> {
    const [task] = await this.db.update(schema.tasks)
      .set({ ...changes, updatedAt: new Date() })
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning();
    return task ?? null;
  }

  async updateTaskStatus(id: string, userId: string, status: 'ACTIVE' | 'COMPLETED'): Promise<Task | null> {
    const [task] = await this.db.update(schema.tasks)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning();
    return task ?? null;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db.delete(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning({ id: schema.tasks.id });
    return deleted.length > 0;
  }

  async deleteByUserIdAndCategoryId(userId: string, categoryId: string): Promise<void> {
    await this.db.delete(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.categoryId, categoryId)));
  }
}
