import { useState } from 'react';
import clsx from 'clsx';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import NotificationBell from '../NotificationBell.jsx';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/submit', label: 'Check a Forward' },
    { to: '/verify', label: 'Verify Queue' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand display">
          <ShieldAlert size={20} className="navbar-brand-icon" />
          <span>WhisperStop</span>
        </Link>

        <div id="navbar-menu" className={clsx('navbar-menu', open && 'navbar-menu--open')}>
          <nav className="navbar-links" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => clsx('navbar-link', isActive && 'navbar-link--active')}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            {user?.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => clsx('navbar-link', isActive && 'navbar-link--active')}
                onClick={() => setOpen(false)}
              >
                <ShieldCheck size={15} /> Admin
              </NavLink>
            )}
          </nav>

          <div className="navbar-actions">
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell />
                <Link to="/profile" className="navbar-profile">
                  <span className="navbar-profile-name">{user.displayName}</span>
                </Link>
                <button className="navbar-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-login">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>

        <button
          className="navbar-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="navbar-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
