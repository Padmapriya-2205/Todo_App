import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!username || !password) { setError('Username and password are required'); return; }
    setLoading(true);
    try { await login(username, password); navigate('/dashboard'); }
    catch { setError('Invalid username or password'); }
    finally { setLoading(false); }
  }
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <h1>Sign in</h1>{error && <div className="error" role="alert">{error}</div>}
    <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
    <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <button disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
    <p>Need an account? <Link to="/register">Register</Link></p>
  </form></div>;
}
