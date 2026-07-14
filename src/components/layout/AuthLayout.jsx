import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, CheckCircle2, ShieldCheck, Forward } from "lucide-react";
import VerdictStamp from "../claim/VerdictStamp.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import "./AuthLayout.css";

const BENEFITS = [
  "Community-verified verdicts",
  "Shareable fact-check cards",
  "Real-time verification queue",
  "Built for WhatsApp forwards",
];

export default function AuthLayout({ heading, subheading, children, stampVerdict = "FALSE" }) {
  return (
    <div className="auth">
      <div className="auth-topbar">
        <ThemeToggle />
      </div>

      <div className="auth-split">
        <aside className="auth-aside">
          <div className="auth-aside-glow" aria-hidden="true" />
          <div className="auth-aside-glow auth-aside-glow-2" aria-hidden="true" />

          <Link to="/" className="auth-home-link">
            <ArrowLeft size={15} /> Back to Home
          </Link>

          <div className="auth-aside-center">
            <div className="auth-aside-brand">
              <ShieldAlert size={22} className="auth-brand-icon" />
              <span>FactStamp</span>
            </div>

            <div className="auth-stage" aria-hidden="true">
              <div className="auth-chat">
                <div className="auth-chat-head">
                  <span className="auth-chat-avatar">M</span>
                  <div className="auth-chat-meta">
                    <span className="auth-chat-name">Mom</span>
                    <span className="auth-chat-fwd">
                      <Forward size={11} /> Forwarded
                    </span>
                  </div>
                </div>
                <p className="auth-bubble">
                  “Hot water with lemon cures dengue fever completely. Forward to
                  10 people for good luck! 🍋”
                </p>
                <div className="auth-reply">
                  <ShieldCheck size={13} /> Stamped
                  <span className="auth-reply-verdict">{stampVerdict}</span>
                </div>
              </div>
              <div className="auth-stage-stamp">
                <VerdictStamp verdict={stampVerdict} claimId="auth-hero" size={122} />
              </div>
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
            <div className="auth-card-brand">
              <ShieldAlert size={16} /> FactStamp
            </div>
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
