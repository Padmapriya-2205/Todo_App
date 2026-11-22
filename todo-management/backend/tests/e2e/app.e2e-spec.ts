import { ConflictException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthRepository } from '../../src/auth/auth.repository';
import { CategoriesService } from '../../src/categories/categories.service';
import { DATABASE } from '../../src/database/database.provider';
import { setupSwagger } from '../../src/swagger';
import { TasksRepository } from '../../src/tasks/tasks.repository';

type Task = {
  id: string;
  userId: string;
  categoryId: string;
  taskName: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
};

describe('Application API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let otherAccessToken: string;
  const taskRecords: Task[] = [];
  const categoryId = '8d8a1b7e-6be2-4c48-b319-125e0bdab14a';
  const ownerId = '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10';
  const otherUserId = 'ba90e578-6cd8-4efb-9887-14faec749839';
  const authUsers = new Map<string, { id: string; username: string; passwordHash: string; createdAt: Date; updatedAt: Date }>();
  const refreshSessions: { id: string; userId: string; tokenHash: string; expiresAt: Date }[] = [];
  const findOwnedTask = (userId: string, id: string) => {
    const task = taskRecords.find((item) => item.id === id && item.userId === userId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  };

  beforeAll(async () => {
    const database = {
      select: jest.fn(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockResolvedValue([]),
      })),
    };
    const tasksRepository = {
      createTask: jest.fn(async (userId: string, dto: { taskName: string; description?: string; categoryId: string }) => {
        const now = new Date();
        const task: Task = {
          id: 'b6f805e2-ade2-4e51-9850-7de4df3db3b5', userId, categoryId: dto.categoryId,
          taskName: dto.taskName, description: dto.description ?? null, status: 'ACTIVE',
          createdAt: now.toISOString(), updatedAt: now.toISOString(),
        };
        taskRecords.push(task);
        return task;
      }),
      findAllByUserId: jest.fn(async (userId: string, filterCategoryId?: string, status?: 'ACTIVE' | 'COMPLETED') =>
        taskRecords.filter((task) => task.userId === userId
          && (!filterCategoryId || task.categoryId === filterCategoryId)
          && (!status || task.status === status))),
      findByIdAndUserId: jest.fn(async (id: string, userId: string) => findOwnedTask(userId, id)),
      updateTask: jest.fn(async (id: string, userId: string, dto: Partial<Task>) => {
        const task = findOwnedTask(userId, id);
        const changes = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
        Object.assign(task, changes, { updatedAt: new Date().toISOString() });
        return task;
      }),
      updateTaskStatus: jest.fn(async (id: string, userId: string, status: Task['status']) => {
        const task = findOwnedTask(userId, id);
        Object.assign(task, { status, updatedAt: new Date().toISOString() });
        return task;
      }),
      deleteTask: jest.fn(async (id: string, userId: string) => {
        findOwnedTask(userId, id);
        taskRecords.splice(taskRecords.findIndex((item) => item.id === id && item.userId === userId), 1);
        return true;
      }),
      deleteByUserIdAndCategoryId: jest.fn(async (userId: string, id: string) => {
        for (let index = taskRecords.length - 1; index >= 0; index -= 1) {
          if (taskRecords[index].userId === userId && taskRecords[index].categoryId === id) taskRecords.splice(index, 1);
        }
      }),
    };
    const authRepository = {
      findByUsername: jest.fn(async (username: string) => authUsers.get(username) ?? null),
      createUserWithProfile: jest.fn(async (username: string, passwordHash: string) => {
        if (authUsers.has(username)) throw new ConflictException('Username already exists');
        const user = {
          id: ownerId,
          username,
          passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        authUsers.set(username, user);
        return user;
      }),
      createRefreshSession: jest.fn(async (userId: string, tokenHash: string, expiresAt: Date) => {
        refreshSessions.push({ id: `session-${refreshSessions.length}`, userId, tokenHash, expiresAt });
      }),
      findValidRefreshSession: jest.fn(async (tokenHash: string, now: Date) =>
        refreshSessions.find((session) => session.tokenHash === tokenHash && session.expiresAt > now) ?? null),
      deleteRefreshSessionById: jest.fn(async (id: string) => {
        const index = refreshSessions.findIndex((session) => session.id === id);
        if (index >= 0) refreshSessions.splice(index, 1);
      }),
      deleteRefreshSessionByTokenHash: jest.fn(async (tokenHash: string) => {
        const index = refreshSessions.findIndex((session) => session.tokenHash === tokenHash);
        if (index >= 0) refreshSessions.splice(index, 1);
      }),
      findById: jest.fn(async (id: string) => [...authUsers.values()].find((user) => user.id === id) ?? null),
      findIdentityById: jest.fn(async (id: string) => {
        const user = [...authUsers.values()].find((item) => item.id === id);
        return user ? { id: user.id, username: user.username } : null;
      }),
    };
    const categories = {
      findById: jest.fn(async (id: string) => {
        if (id !== categoryId) throw new NotFoundException('Category not found');
        return { id, name: 'Personal', createdAt: new Date() };
      }),
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useValue(database)
      .overrideProvider(TasksRepository)
      .useValue(tasksRepository)
      .overrideProvider(AuthRepository)
      .useValue(authRepository)
      .overrideProvider(CategoriesService)
      .useValue(categories)
      .compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    setupSwagger(app);
    await app.init();
    const jwt = app.get(JwtService);
    accessToken = jwt.sign(
      { sub: ownerId, username: 'testuser' },
      { secret: process.env.JWT_ACCESS_SECRET || 'development-access-secret' },
    );
    otherAccessToken = jwt.sign(
      { sub: otherUserId, username: 'otheruser' },
      { secret: process.env.JWT_ACCESS_SECRET || 'development-access-secret' },
    );
  });

  beforeEach(() => {
    taskRecords.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves Swagger UI and OpenAPI security documentation', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200);
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(response.body.components.securitySchemes.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(response.body.paths['/auth/register'].post.security).toBeUndefined();
    expect(response.body.paths['/auth/login'].post.security).toBeUndefined();
    expect(response.body.paths['/tasks'].get.security).toEqual([{ bearer: [] }]);
  });

  it('registers and logs in publicly, then uses the returned token on protected task APIs', async () => {
    const credentials = { username: 'swagger-user', password: 'Password123' };
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    expect(registered.body).toMatchObject({ username: credentials.username });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(201);
    expect(login.body).toMatchObject({
      accessToken: expect.any(String),
      user: { id: registered.body.id, username: credentials.username },
    });
    expect(login.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/i);

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ taskName: 'Created from authorized session', categoryId })
      .expect(201)
      .expect(({ body }) => expect(body.userId).toBe(registered.body.id));
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects protected task requests without a token or with an invalid token', async () => {
    await request(app.getHttpServer()).get('/tasks').expect(401);
    await request(app.getHttpServer()).get('/tasks').set('Authorization', 'Bearer invalid-token').expect(401);
  });

  it('allows a valid bearer token to access the authenticated user task API', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body).toEqual([]);
  });

  it('creates, reads, filters, partially updates, completes, and deletes tasks through the API', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskName: 'Prepare proposal', description: 'Outline', categoryId })
      .expect(201);
    expect(created.body).toMatchObject({
      userId: ownerId,
      categoryId,
      taskName: 'Prepare proposal',
      description: 'Outline',
      status: 'ACTIVE',
    });

    await request(app.getHttpServer())
      .get('/tasks')
      .query({ categoryId, status: 'ACTIVE' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect([created.body]);
    await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Updated description' })
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({
        taskName: 'Prepare proposal',
        description: 'Updated description',
      }));
    await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('COMPLETED'));
    await request(app.getHttpServer())
      .get('/tasks')
      .query({ status: 'ACTIVE' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect([]);
    await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('isolates task ownership and rejects invalid inputs and identifiers', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskName: 'Private task', categoryId })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ taskName: 'Hijacked task' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskName: 'Spoofed owner', categoryId, userId: otherUserId })
      .expect(400);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskName: '   ', categoryId })
      .expect(400);
    await request(app.getHttpServer())
      .get('/tasks/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
    await request(app.getHttpServer())
      .get('/tasks')
      .query({ status: 'PENDING' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
