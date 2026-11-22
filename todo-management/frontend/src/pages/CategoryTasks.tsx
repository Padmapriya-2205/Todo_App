import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { Category, Task } from '../types';
import TaskForm from '../components/tasks/TaskForm';

export default function CategoryTasks({ categoryName }: { categoryName: 'Work' | 'Personal' }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data: categories } = await api.get<Category[]>('/categories');
      const found = categories.find((item) => item.name === categoryName);
      if (!found) throw new Error('Category missing');
      setCategory(found);
      const { data } = await api.get<Task[]>(`/tasks?categoryId=${found.id}`);
      setTasks(data);
    } catch { setError(`${categoryName} tasks could not be loaded`); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [categoryName]);

  async function create(taskName: string, description: string) {
    if (!category) return;
    try {
      const { data } = await api.post<Task>('/tasks', { taskName, description: description || undefined, categoryId: category.id });
      setTasks((current) => [...current, data]);
    } catch { setError('Task could not be created'); }
  }
  async function toggle(task: Task) {
    const status = task.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    try {
      const { data } = await api.patch<Task>(`/tasks/${task.id}/status`, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? data : item));
    } catch { setError('Task status could not be updated'); }
  }
  async function remove(task: Task) {
    if (!window.confirm(`Delete "${task.taskName}"?`)) return;
    try { await api.delete(`/tasks/${task.id}`); setTasks((current) => current.filter((item) => item.id !== task.id)); }
    catch { setError('Task could not be deleted'); }
  }
  function startEditing(task: Task) {
    setEditingTask(task);
    setEditTaskName(task.taskName);
    setEditDescription(task.description || '');
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingTask || !editTaskName.trim()) return;
    try {
      const { data } = await api.patch<Task>(`/tasks/${editingTask.id}`, {
        taskName: editTaskName.trim(),
        description: editDescription.trim(),
      });
      setTasks((current) => current.map((item) => item.id === editingTask.id ? data : item));
      setEditingTask(null);
    } catch { setError('Task could not be updated'); }
  }
  function cancelEdit() {
    setEditingTask(null);
  }
  async function clearAll() {
    if (!category || !window.confirm(`Clear all ${categoryName} tasks?`)) return;
    try { await api.delete(`/tasks/category/${category.id}`); setTasks([]); }
    catch { setError('Tasks could not be cleared'); }
  }

  return <div className="page">
    <div className="page-heading"><h1>{categoryName} Tasks</h1>{tasks.length > 0 && <button className="danger" onClick={clearAll}>Clear All</button>}</div>
    {error && <div className="error" role="alert">{error}</div>}
    {category && <TaskForm categoryId={category.id} onSubmit={create} />}
    {loading ? <div className="loading">Loading...</div> : tasks.length === 0 ? <div className="empty">No {categoryName.toLowerCase()} tasks yet.</div> :
      <div className="task-list">{tasks.map((task) => <article className="task-card" key={task.id}>
        <input aria-label={`Complete ${task.taskName}`} type="checkbox" checked={task.status === 'COMPLETED'} onChange={() => void toggle(task)} />
        <div className="task-info"><h3 className={task.status === 'COMPLETED' ? 'completed' : ''}>{task.taskName}</h3>{task.description && <p>{task.description}</p>}</div>
        <div className="task-actions"><button aria-label={`Edit ${task.taskName}`} onClick={() => startEditing(task)}>Edit</button><button aria-label={`Delete ${task.taskName}`} className="danger-link" onClick={() => void remove(task)}>Delete</button></div>
      </article>)}</div>}
    {editingTask && <div className="modal-backdrop">
      <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
        <h2 id="edit-task-title">Edit task</h2>
        <form onSubmit={saveEdit}>
          <label>Task name<input autoFocus aria-label="Task name" value={editTaskName} onChange={(event) => setEditTaskName(event.target.value)} required /></label>
          <label>Description<textarea aria-label="Description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button>
            <button type="submit" disabled={!editTaskName.trim()}>Save Changes</button>
          </div>
        </form>
      </section>
    </div>}
  </div>;
}
