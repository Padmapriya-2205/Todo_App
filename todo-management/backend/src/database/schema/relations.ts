import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { profiles } from './profiles.schema';
import { tasks } from './tasks.schema';
import { categories } from './categories.schema';
import { refreshTokens } from './refresh-tokens.schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  tasks: many(tasks),
  refreshTokens: many(refreshTokens),
}));
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({ tasks: many(tasks) }));
export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  category: one(categories, { fields: [tasks.categoryId], references: [categories.id] }),
}));
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));
