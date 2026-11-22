import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.provider';
import * as schema from '../database/schema';
import { UpdateProfileDto } from './profile.dto';
type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class ProfilesService {
  constructor(@Inject(DATABASE) private db: Db) {}
  async get(userId: string) {
    const [row] = await this.db.select({
      name: schema.profiles.name, age: schema.profiles.age, profession: schema.profiles.profession,
      username: schema.users.username,
    }).from(schema.profiles).innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId)).where(eq(schema.profiles.userId, userId)).limit(1);
    if (!row) throw new NotFoundException('Profile not found');
    return row;
  }
  async update(userId: string, dto: UpdateProfileDto) {
    const [row] = await this.db.update(schema.profiles).set({ ...dto, updatedAt: new Date() }).where(eq(schema.profiles.userId, userId)).returning();
    if (!row) throw new NotFoundException('Profile not found');
    return this.get(userId);
  }
}
