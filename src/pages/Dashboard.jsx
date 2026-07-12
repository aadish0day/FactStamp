import { useMemo } from 'react';
import { Helmet } from "react-helmet-async";
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts';
import {
  Trophy, ArrowRight, BarChart3, Crown, Medal,
} from 'lucide-react';
import CountUp from '../components/ui/CountUp.jsx';
import CategoryTag from '../components/claim/CategoryTag.jsx';
import VerdictBadge from '../components/claim/VerdictBadge.jsx';
import Badge from '../components/ui/Badge.jsx';
import { MOCK_TRENDING, MOCK_USERS, MOCK_CLAIMS } from '../data/mockData.js';
import { timeAgo } from '../logic/formatDate.js';
import './Dashboard.css';

const CAT_HEX = {
  Health: '#EF4444',
  Financial: '#22C55E',
  Political: '#6C63FF',
  Religious: '#F59E0B',
  Other: '#6B7280',
};

function anonymize(name) {
  const clean = name.replace(/\s+/g, '');
  if (clean.length <= 4) return clean[0] + '***';
  return clean.slice(0, 3) + '***' + clean.slice(-1);
}

function repColor(r) {
  if (r > 70) return 'var(--v-true)';
  if (r >= 40) return 'var(--v-misleading)';
  return 'var(--v-false)';
}
function accColor(a) {
  if (a > 80) return 'var(--v-true)';
  if (a >= 60) return 'var(--v-misleading)';
  return 'var(--v-false)';
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="db-tooltip">
      <span className="db-tooltip-name">{d.name}</span>
      <span className="db-tooltip-val">{d.count} claims · {Math.round((d.count / MOCK_TRENDING.totalClaims) * 100)}%</span>
    </div>
  );
}

const STATUS_DOT = {
  TRUE: 'var(--v-true)',
  FALSE: 'var(--v-false)',
  MISLEADING: 'var(--v-misleading)',
  UNVERIFIABLE: 'var(--v-unverifiable)',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const pieData = MOCK_TRENDING.topCategories.map((c) => ({
    name: c.name,
    count: c.count,
    color: CAT_HEX[c.name] || c.color,
  }));

  const topDebunked = useMemo(
    () =>
      MOCK_CLAIMS.filter((c) => c.status === 'verified' && c.verdict === 'FALSE')
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5),
    []
  );

  const recent = useMemo(
    () =>
      MOCK_CLAIMS.filter((c) => c.status === 'verified')
        .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt))
        .slice(0, 15),
    []
  );

  const leaderboard = useMemo(
    () => [...MOCK_USERS].sort((a, b) => b.reputation - a.reputation),
    []
  );

  return (
    <div className="db-page container">
    <Helmet><title>WhisperStop | Dashboard</title></Helmet>
      <header className="db-head">
        <h2 className="db-title display">
          <BarChart3 size={26} /> Misinformation Dashboard
        </h2>
        <span className="db-range mono">Week of Jul 7–13, 2026</span>
      </header>

      <div className="db-stats">
        <div className="db-stat">
          <CountUp className="db-stat-num db-accent" end={MOCK_TRENDING.totalClaims} />
          <div className="db-stat-label">Total Claims</div>
        </div>
        <div className="db-stat">
          <CountUp className="db-stat-num db-true" end={MOCK_TRENDING.totalVerified} />
          <div className="db-stat-label">Verified</div>
        </div>
        <div className="db-stat">
          <CountUp className="db-stat-num db-false" end={MOCK_TRENDING.falseCount} />
          <div className="db-stat-label">False Caught</div>
        </div>
        <div className="db-stat">
          <CountUp className="db-stat-num db-accent" end={MOCK_TRENDING.activeVerifiers} />
          <div className="db-stat-label">Active Verifiers</div>
        </div>
      </div>

      <div className="db-cols">
        <div className="db-card">
          <h3 className="db-card-title">Category Breakdown</h3>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <RTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="db-legend">
            {pieData.map((d) => (
              <div key={d.name} className="db-legend-item">
                <span className="db-legend-dot" style={{ background: d.color }} />
                <span className="db-legend-name">{d.name}</span>
                <span className="db-legend-count mono">{d.count}</span>
                <span className="db-legend-pct mono">{Math.round((d.count / MOCK_TRENDING.totalClaims) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <h3 className="db-card-title">Top Debunked Claims</h3>
          <div className="db-debunked">
            {topDebunked.map((c) => (
              <button key={c.id} className="db-debunked-item" onClick={() => navigate(`/claim/${c.id}`)}>
                <VerdictBadge verdict={c.verdict} size="sm" />
                <div className="db-debunked-body">
                  <p className="db-debunked-text">{c.text}</p>
                  <CategoryTag category={c.category} />
                </div>
                <ArrowRight size={14} className="db-debunked-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="db-card db-full">
        <h3 className="db-card-title"><Trophy size={16} /> Top Verifiers This Week</h3>
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Verifier</th>
                <th>Verifications</th>
                <th>Accuracy</th>
                <th>Reputation</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((u, i) => {
                const acc = Math.round((u.correctVerifications / u.totalVerifications) * 100);
                return (
                  <tr key={u.uid}>
                    <td className="db-rank mono">
                      {i === 0 ? <Crown size={14} /> : i < 3 ? <Medal size={14} /> : i + 1}
                    </td>
                    <td className="db-name">{anonymize(u.displayName)}</td>
                    <td className="mono">{u.totalVerifications}</td>
                    <td className="mono" style={{ color: accColor(acc) }}>{acc}%</td>
                    <td className="mono" style={{ color: repColor(u.reputation) }}>{u.reputation}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="db-card db-full">
        <h3 className="db-card-title">Recent Activity</h3>
        <div className="db-feed">
          {recent.map((c, i) => (
            <div key={c.id} className="db-feed-item">
              <span className="db-feed-dot" style={{ background: STATUS_DOT[c.verdict] || 'var(--text-3)' }} />
              {i < recent.length - 1 && <span className="db-feed-line" />}
              <button className="db-feed-content" onClick={() => navigate(`/claim/${c.id}`)}>
                <span className="db-feed-text">{c.text}</span>
                <div className="db-feed-tags">
                  <VerdictBadge verdict={c.verdict} size="sm" />
                  <CategoryTag category={c.category} />
                </div>
              </button>
              <span className="db-feed-time mono">{timeAgo(c.verifiedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
