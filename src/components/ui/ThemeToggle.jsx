import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import Tooltip from './Tooltip.jsx';
import './ui.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Tooltip label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </Tooltip>
  );
}
