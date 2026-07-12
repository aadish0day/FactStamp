import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={i} className="breadcrumbs-item">
            {it.to ? (
              <Link to={it.to} className="breadcrumbs-link">
                {it.label}
              </Link>
            ) : (
              <span className="breadcrumbs-current" aria-current="page">
                {it.label}
              </span>
            )}
            {i < items.length - 1 && (
              <ChevronRight size={14} className="breadcrumbs-sep" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
