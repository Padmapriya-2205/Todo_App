import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../src/services/api';
import CategoryTasks from '../../../src/pages/CategoryTasks';

vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const categories = [
  { id: 'work-id', name: 'Work', createdAt: '' },
  { id: 'personal-id', name: 'Personal', createdAt: '' },
];

const task = {
  id: 'task-id',
  userId: 'user-id',
  categoryId: 'personal-id',
  taskName: 'Existing task',
  description: 'Existing description',
  status: 'ACTIVE' as const,
  createdAt: '',
  updatedAt: '',
};

describe('CategoryTasks', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/categories' ? categories : [task],
    }) as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('updates the description without changing the task name', async () => {
    const updatedTask = { ...task, description: 'Updated description' };
    vi.mocked(api.patch).mockResolvedValue({ data: updatedTask } as never);
    render(<CategoryTasks categoryName="Personal" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Existing task' }));
    const descriptionField = within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Description' });
    expect(descriptionField).toHaveValue('Existing description');
    await userEvent.clear(descriptionField);
    await userEvent.type(descriptionField, 'Updated description');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/tasks/task-id', {
      taskName: 'Existing task',
      description: 'Updated description',
    }));
    expect(await screen.findByText('Updated description')).toBeInTheDocument();
  });

  it('creates a task with the current page category and no category selector', async () => {
    vi.mocked(api.get).mockImplementation((url) => Promise.resolve({
      data: url === '/categories' ? categories : [],
    }) as never);
    vi.mocked(api.post).mockResolvedValue({ data: { ...task, categoryId: 'work-id' } } as never);
    render(<CategoryTasks categoryName="Work" />);

    await userEvent.type(await screen.findByRole('textbox', { name: 'Task name' }), 'New task');
    expect(screen.queryByText('Category:')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/tasks', {
      taskName: 'New task',
      description: undefined,
      categoryId: 'work-id',
    }));
  });
});
