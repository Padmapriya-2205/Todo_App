import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try { await register(username, password); navigate('/login'); }
    catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Registration failed');
    } finally { setLoading(false); }
  }
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <h1>Create account</h1>{error && <div className="error" role="alert">{error}</div>}
    <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
    <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <button disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
    <p>Already have an account? <Link to="/login">Login</Link></p>
  </form></div>;
}
