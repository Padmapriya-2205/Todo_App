import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { categories } from './categories.schema';

export const taskStatusEnum = pgEnum('task_status', ['ACTIVE', 'COMPLETED']);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('tasks_user_id_idx').on(table.userId),
  index('tasks_category_id_idx').on(table.categoryId),
  index('tasks_status_idx').on(table.status),
  index('tasks_user_category_idx').on(table.userId, table.categoryId),
]);
