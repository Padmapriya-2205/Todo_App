import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gt } from 'drizzle-orm';
import { DATABASE } from '../database/database.provider';
import * as schema from '../database/schema';

type Db = NodePgDatabase<typeof schema>;
type User = typeof schema.users.$inferSelect;
type RefreshSession = typeof schema.refreshTokens.$inferSelect;

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await this.db.select().from(schema.users)
      .where(eq(schema.users.username, username)).limit(1);
    return user ?? null;
  }

  async createUserWithProfile(username: string, passwordHash: string): Promise<User> {
    return this.db.transaction(async (tx) => {
      const [user] = await tx.insert(schema.users).values({ username, passwordHash }).returning();
      await tx.insert(schema.profiles).values({ userId: user.id });
      return user;
    });
  }

  async createRefreshSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.insert(schema.refreshTokens).values({ userId, tokenHash, expiresAt });
  }

  async findValidRefreshSession(tokenHash: string, now: Date): Promise<RefreshSession | null> {
    const [session] = await this.db.select().from(schema.refreshTokens).where(and(
      eq(schema.refreshTokens.tokenHash, tokenHash),
      gt(schema.refreshTokens.expiresAt, now),
    )).limit(1);
    return session ?? null;
  }

  async deleteRefreshSessionById(id: string): Promise<void> {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, id));
  }

  async deleteRefreshSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.tokenHash, tokenHash));
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user ?? null;
  }

  async findIdentityById(id: string): Promise<Pick<User, 'id' | 'username'> | null> {
    const [user] = await this.db.select({ id: schema.users.id, username: schema.users.username })
      .from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user ?? null;
  }
}
