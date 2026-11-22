export interface User { id: string; username: string }
export interface Category { id: string; name: 'Work' | 'Personal'; createdAt: string }
export interface Task {
  id: string;
  userId: string;
  categoryId: string;
  taskName: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
export interface Profile { name: string | null; age: number | null; profession: string | null; username: string }
