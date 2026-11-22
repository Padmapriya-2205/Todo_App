import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.provider';
import * as schema from '../database/schema';
type Db = NodePgDatabase<typeof schema>;
@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE) private db: Db) {}
  findAll() { return this.db.select().from(schema.categories).orderBy(schema.categories.name); }
  async findById(id: string) {
    const [category] = await this.db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
