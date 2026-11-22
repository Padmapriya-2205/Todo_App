import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Category, Task } from '../types';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    Promise.all([api.get<Task[]>('/tasks'), api.get<Category[]>('/categories')])
      .then(([tasksResult, categoriesResult]) => { setTasks(tasksResult.data); setCategories(categoriesResult.data); })
      .catch(() => setError('Could not load dashboard')).finally(() => setLoading(false));
  }, []);
  const count = (status?: Task['status'], categoryId?: string) => tasks.filter((task) =>
    (!status || task.status === status) &&
    (!categoryId || task.categoryId === categoryId)).length;
  if (loading) return <div className="page"><div className="loading">Loading...</div></div>;
  return <div className="page">
    <h1>Dashboard</h1>{error && <div className="error">{error}</div>}
    <div className="summary-grid">
      <article className="summary-card"><span>Total tasks</span><strong>{tasks.length}</strong></article>
      <article className="summary-card"><span>Active tasks</span><strong>{count('ACTIVE')}</strong></article>
      <article className="summary-card"><span>Completed tasks</span><strong>{count('COMPLETED')}</strong></article>
      {categories.map((category) => <article className="summary-card" key={category.id}><span>{category.name} tasks</span><strong>{count(undefined, category.id)}</strong></article>)}
    </div>
  </div>;
}
