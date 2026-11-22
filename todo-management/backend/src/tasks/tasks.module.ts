import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
@Module({ imports: [CategoriesModule], controllers: [TasksController], providers: [TasksService, TasksRepository], exports: [TasksService] })
export class TasksModule {}
