import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">TaskFlow</div>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/work">Work</NavLink>
          <NavLink to="/personal">Personal</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>
      <main className="main">
        <header className="header"><span>Welcome, {user?.username}</span></header>
        <Outlet />
      </main>
    </div>
  );
}
