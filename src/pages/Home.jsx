import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Search, Users, CheckCircle, Share2, ShieldAlert, Check, X } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ClaimCard from '../components/claim/ClaimCard.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useData } from '../context/DataContext.jsx';
import './Home.css';

const STATS = [
  { end: 2341, label: 'Claims Verified' },
  { end: 892, label: 'False Claims Caught' },
  { end: 148, label: 'Active Verifiers' },
  { end: 94, suffix: '%', label: 'Average Accuracy' },
];

const STEPS = [
  { n: '01', icon: Search, title: 'Paste the Forward', desc: 'Drop in any WhatsApp message — in any language — that you suspect might be fake.' },
  { n: '02', icon: Users, title: 'Community Verifies', desc: '3 independent verifiers review your claim with credible, cited sources.' },
  { n: '03', icon: CheckCircle, title: 'Get a Verdict', desc: 'Receive a clear TRUE, FALSE, MISLEADING or UNVERIFIABLE stamp with confidence.' },
  { n: '04', icon: Share2, title: 'Share the Card', desc: 'Send the fact-check card right back into the same group to stop the spread.' },
];

const COMPARISON = [
  { name: 'AltNews', accent: false, points: ['Expert-led only', 'Long wait times', 'No shareable cards', 'Web articles only'] },
  { name: 'Boom', accent: false, points: ['Expert-led only', 'Limited languages', 'No community input', 'No WhatsApp focus'] },
  { name: 'WhisperStop', accent: true, points: ['Community verified', 'Shareable cards', 'Real-time queue', 'Built for WhatsApp'] },
];

function ClaimCardSkeleton() {
  return (
    <div className="claim-card claim-card-skel">
      <div className="claim-card-top">
        <Skeleton width={90} height={22} borderRadius={999} />
        <Skeleton width={54} height={14} borderRadius={6} />
      </div>
      <Skeleton width="100%" height={14} borderRadius={6} style={{ marginTop: 14 }} />
      <Skeleton width="85%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Skeleton width={70} height={22} borderRadius={999} />
        <Skeleton width={90} height={22} borderRadius={999} />
      </div>
    </div>
  );
}

export default function Home() {
  const { claims } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const verified = claims.filter((c) => c.status === 'verified');
      setRecent(verified.slice(0, 6));
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [claims]);

  return (
    <div className="home">
      <section className="home-hero">
        <div className="container home-hero-inner">
          <span className="home-eyebrow">
            <ShieldAlert size={15} /> India's Misinformation Fact-Checker — Now in Beta
          </span>
          <h1 className="home-title display">
            Stop <span className="home-title-mark">Misinformation.</span>
            <br />One Forward at a Time.
          </h1>
          <p className="home-sub">
            WhisperStop lets anyone in India check viral WhatsApp forwards in seconds —
            verified by a community of trusted reviewers, not algorithms alone.
          </p>
          <div className="home-cta">
            <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => navigate('/submit')}>
              Check a Forward
            </Button>
            <Link to="/dashboard"><Button variant="secondary" size="lg">View Dashboard</Button></Link>
          </div>
          <div className="home-trust">
            <span><Check size={14} /> 100% Free</span>
            <span><Check size={14} /> No Login to View</span>
            <span><Check size={14} /> AI-Powered</span>
          </div>
        </div>
      </section>

      <section className="container home-stats">
        {STATS.map((s) => (
          <div key={s.label} className="home-stat">
            <div className="home-stat-num mono"><CountUp end={s.end} suffix={s.suffix || ''} /></div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="container home-recent">
        <div className="home-section-head">
          <h2 className="home-section-title display">Recently Verified</h2>
          <Link to="/verify" className="home-section-link">View All Verified →</Link>
        </div>
        <div className="home-recent-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ClaimCardSkeleton key={i} />)
            : recent.map((c) => <ClaimCard key={c.id} claim={c} onClick={() => navigate(`/claim/${c.id}`)} />)}
        </div>
      </section>

      <section className="container home-how" id="how">
        <div className="home-how-head">
          <h2 className="home-how-title display">How It Works</h2>
          <p className="home-how-sub">From a suspicious forward to a verified, shareable fact in four simple steps.</p>
        </div>
        <div className="home-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="home-step">
              <div className="home-step-num mono">{s.n}</div>
              <s.icon className="home-step-icon" size={32} />
              <h3 className="home-step-title display">{s.title}</h3>
              <p className="home-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-why" id="why">
        <div className="home-how-head">
          <h2 className="home-how-title display">Why WhisperStop</h2>
          <p className="home-how-sub">Built for the way misinformation actually spreads — inside group chats.</p>
        </div>
        <div className="home-compare">
          {COMPARISON.map((c) => (
            <div key={c.name} className={clsx('home-compare-card', c.accent && 'home-compare-card--accent')}>
              <h3 className="home-compare-name display">{c.name}</h3>
              <ul className="home-compare-list">
                {c.points.map((p) => {
                  const isNo = p.startsWith('No ') || p.startsWith('Limited') || p.startsWith('Expert') || p.startsWith('Web') || p.startsWith('Long');
                  return (
                    <li key={p} className={clsx('home-compare-item', c.accent ? (isNo ? 'home-compare-no' : 'home-compare-yes') : '')}>
                      {c.accent ? (isNo ? <X size={14} /> : <Check size={14} />) : '•'} {p}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
