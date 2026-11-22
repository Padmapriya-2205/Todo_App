import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

interface Props { categoryId: string; onSubmit: (taskName: string, description: string) => Promise<void>; }
export default function TaskForm({ categoryId, onSubmit }: Props) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setTaskName(''); setDescription(''); }, [categoryId]);
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!taskName.trim()) { setError('Task name is required'); return; }
    setError('');
    void onSubmit(taskName.trim(), description.trim()).then(() => { setTaskName(''); setDescription(''); });
  }
  return <form className="task-form" onSubmit={handleSubmit}>
    {error && <div className="error" role="alert">{error}</div>}
    <input aria-label="Task name" placeholder="Task name" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
    <textarea aria-label="Description" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
    <button type="submit">Add task</button>
  </form>;
}
