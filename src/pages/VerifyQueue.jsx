import { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight, ListFilter, HeartPulse, Landmark, BookHeart, Coins, ClipboardList, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import Badge from "../components/ui/Badge.jsx";
import CategoryTag from "../components/claim/CategoryTag.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { timeAgo } from "../logic/formatDate.js";
import "./VerifyQueue.css";

const FILTERS = [
  { key: "all", label: "All", Icon: ListFilter, color: "var(--accent)" },
  { key: "health", label: "Health", Icon: HeartPulse, color: "var(--cat-health)" },
  { key: "political", label: "Political", Icon: Landmark, color: "var(--cat-political)" },
  { key: "religious", label: "Religious", Icon: BookHeart, color: "var(--cat-religious)" },
  { key: "financial", label: "Financial", Icon: Coins, color: "var(--cat-financial)" },
  { key: "other", label: "Other", Icon: ClipboardList, color: "var(--cat-other)" },
  { key: "urgent", label: "Urgent", Icon: AlertTriangle, color: "var(--v-false)" },
];

const MAX_VERIFIERS = 3;

function ConsensusTrack({ count }) {
  const close = count === MAX_VERIFIERS - 1;
  return (
    <div className={clsx("vq-consensus", close && "vq-consensus--close")}>
      <div className="vq-slots" role="img" aria-label={`${count} of ${MAX_VERIFIERS} verifiers have weighed in`}>
        {Array.from({ length: MAX_VERIFIERS }).map((_, i) => (
          <span
            key={i}
            className={clsx(
              "vq-slot",
              i < count && "vq-slot--filled",
              i === count && "vq-slot--next",
            )}
          />
        ))}
      </div>
      <span className="vq-consensus-label mono">
        {count}/{MAX_VERIFIERS} verifiers
      </span>
    </div>
  );
}

export default function VerifyQueue() {
  const { claims } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("oldest");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const pending = claims.filter((c) => c.status === "pending");
  const verifiedToday = claims.filter(
    (c) =>
      c.status === "verified" &&
      c.verifiedAt &&
      new Date(c.verifiedAt) > new Date("2026-07-11T00:00:00Z"),
  ).length;
  const accuracy =
    user && user.totalVerifications
      ? Math.round((user.correctVerifications / user.totalVerifications) * 100)
      : 0;

  let list = pending;
  if (filter === "urgent") list = list.filter((c) => c.isUrgent);
  else if (filter !== "all") list = list.filter((c) => c.category === filter);

  list = [...list].sort((a, b) =>
    sort === "oldest"
      ? new Date(a.createdAt) - new Date(b.createdAt)
      : new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className="vq-page container">
      <Seo title="FactStamp | Verification Queue" description="Browse unverified WhatsApp claims in the FactStamp verification queue and help fact-check them." />

      <header className="vq-head">
        <div className="vq-head-top">
          <Badge tone="neutral" size="sm" icon={ShieldCheck}>
            Protected
          </Badge>
          <span className="vq-live">
            <span className="vq-live-dot" /> Live queue
          </span>
        </div>
        <h2 className="vq-title display">Verification Queue</h2>
        <p className="vq-sub">
          Pick a forwarded claim, weigh in with your verdict, and help the
          community reach a consensus.
        </p>
      </header>

      <div className="vq-stats">
        <div className="vq-stat vq-stat--lead">
          <span className="vq-stat-dot" aria-hidden="true" />
          <div className="vq-stat-num mono">{pending.length}</div>
          <div className="vq-stat-label">Pending Claims</div>
        </div>
        <div className="vq-stat">
          <div className="vq-stat-num mono vq-stat--good">{verifiedToday}</div>
          <div className="vq-stat-label">Verified Today</div>
        </div>
        <div className="vq-stat">
          <div className="vq-stat-num mono">{accuracy}%</div>
          <div className="vq-stat-label">Your Accuracy</div>
        </div>
      </div>

      <div className="vq-toolbar">
        <div className="vq-filters" role="tablist" aria-label="Filter by category">
          {FILTERS.map(({ key, label, Icon, color }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                className={clsx("vq-pill", active && "vq-pill--active")}
                style={active ? { background: color, borderColor: color, color: "#fff" } : undefined}
                onClick={() => setFilter(key)}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="vq-sort-wrap">
          <select
            className="vq-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort claims"
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="vq-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vq-item vq-item--skel">
              <div className="vq-item-top">
                <Skeleton width={92} height={22} borderRadius={999} />
                <Skeleton width={64} height={22} borderRadius={999} />
              </div>
              <Skeleton width="92%" height={16} borderRadius={6} style={{ margin: "14px 0 12px" }} />
              <div className="vq-item-foot">
                <Skeleton width={120} height={14} borderRadius={6} />
                <Skeleton width={120} height={38} borderRadius={12} />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Queue is Clear!"
          description="No claims match this filter right now. Check back later or broaden your view."
        />
      ) : (
        <div className="vq-list">
          {list.map((c) => (
            <article key={c.id} className="vq-item">
              <div className="vq-item-top">
                <CategoryTag category={c.category} />
                {c.isUrgent && (
                  <span className="vq-urgent">
                    <AlertTriangle size={12} /> Urgent
                  </span>
                )}
              </div>
              <p className="vq-item-text">{c.text}</p>
              <ConsensusTrack count={c.verificationCount} />
              <div className="vq-item-foot">
                <span className="vq-item-meta mono">
                  Submitted {timeAgo(c.createdAt)}
                </span>
                <Link to={`/verify/${c.id}`} className="btn btn-primary btn-md vq-cta">
                  Verify This <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
