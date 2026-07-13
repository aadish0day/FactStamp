import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import "./AuthLayout.css";

const BENEFITS = [
  "Community-verified verdicts",
  "Shareable fact-check cards",
  "Real-time verification queue",
  "Built for WhatsApp forwards",
];

export default function AuthLayout({ heading, subheading, children }) {
  return (
    <div className="auth">
      <div className="auth-split">
        <aside className="auth-aside">
          <div className="auth-aside-glow" aria-hidden="true" />
          <div className="auth-aside-inner">
            <Link to="/" className="auth-home-link">
              <ArrowLeft size={15} /> Back to Home
            </Link>
            <div className="auth-aside-brand">
              <ShieldAlert size={22} className="auth-brand-icon" />
              <span>FactStamp</span>
            </div>
            <h1 className="auth-headline">
              Stop misinformation before it spreads.
            </h1>
            <p className="auth-aside-sub">
              A community fact-checking layer for the forwards you receive
              every day.
            </p>
            <ul className="auth-benefits">
              {BENEFITS.map((b) => (
                <li key={b}>
                  <CheckCircle2 size={16} /> {b}
                </li>
              ))}
            </ul>
          </div>
          <p className="auth-copyright">
            © {new Date().getFullYear()} FactStamp · Verify before you forward.
          </p>
        </aside>

        <main className="auth-main">
          <div className="auth-card">
            <header className="auth-card-head">
              <h2 className="auth-card-title">{heading}</h2>
              {subheading && <p className="auth-card-sub">{subheading}</p>}
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
