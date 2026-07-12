import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo display">
            <ShieldAlert size={20} className="footer-logo-icon" /> FactStamp
          </span>
          <p className="footer-tag">Verify before you forward. Stop misinformation one WhatsApp group at a time.</p>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-col-title">Product</span>
            <Link to="/submit">Check a Forward</Link>
            <Link to="/verify">Verify Queue</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Account</span>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">About</span>
            <a href="#how">How it works</a>
            <a href="#why">Why FactStamp</a>
            <span className="footer-muted">Beta · Made in India</span>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 FactStamp · A community misinformation fact-checker</span>
        <span className="mono footer-muted">factstamp.vercel.app</span>
      </div>
    </footer>
  );
}
