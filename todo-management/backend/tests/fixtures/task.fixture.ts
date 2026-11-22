export interface TaskFixture {
  id: string;
  userId: string;
  categoryId: string;
  taskName: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export function createTaskFixture(overrides: Partial<TaskFixture> = {}): TaskFixture {
  return {
    id: 'b6f805e2-ade2-4e51-9850-7de4df3db3b5',
    userId: '59ca8ad4-6a6f-4f25-9a7f-d25b725c0d10',
    categoryId: '8d8a1b7e-6be2-4c48-b319-125e0bdab14a',
    taskName: 'Prepare proposal',
    description: 'Outline',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
