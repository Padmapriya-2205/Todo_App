import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { CreateTaskDto, UpdateTaskDto, UpdateStatusDto } from './tasks.dto';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasks: TasksRepository, private readonly categories: CategoriesService) {}
  async create(userId: string, dto: CreateTaskDto) {
    await this.categories.findById(dto.categoryId);
    return this.tasks.createTask(userId, dto);
  }
  async findAll(userId: string, categoryId?: string, status?: 'ACTIVE' | 'COMPLETED') {
    return this.tasks.findAllByUserId(userId, categoryId, status);
  }
  async findOne(userId: string, id: string) {
    const task = await this.tasks.findByIdAndUserId(id, userId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(userId, id);
    if (dto.categoryId) await this.categories.findById(dto.categoryId);
    const task = await this.tasks.updateTask(id, userId, dto);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
  async updateStatus(userId: string, id: string, dto: UpdateStatusDto) {
    await this.findOne(userId, id);
    const task = await this.tasks.updateTaskStatus(id, userId, dto.status);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    if (!await this.tasks.deleteTask(id, userId)) throw new NotFoundException('Task not found');
  }
  async clearCategory(userId: string, categoryId: string) {
    await this.categories.findById(categoryId);
    await this.tasks.deleteByUserIdAndCategoryId(userId, categoryId);
  }
}
