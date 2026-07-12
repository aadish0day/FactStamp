import { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, HeartPulse, Landmark, BookHeart, Coins, ClipboardList, AlertTriangle, ShieldCheck, ListFilter } from "lucide-react";
import Badge from "../components/ui/Badge.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import CategoryTag from "../components/claim/CategoryTag.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { timeAgo } from "../logic/formatDate.js";
import "./VerifyQueue.css";

const FILTERS = [
  { key: "all", label: "All", Icon: ListFilter },
  { key: "health", label: "Health", Icon: HeartPulse },
  { key: "political", label: "Political", Icon: Landmark },
  { key: "religious", label: "Religious", Icon: BookHeart },
  { key: "financial", label: "Financial", Icon: Coins },
  { key: "other", label: "Other", Icon: ClipboardList },
  { key: "urgent", label: "Urgent", Icon: AlertTriangle },
];

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
    <Seo title="WhisperStop | Verification Queue" description="Browse unverified WhatsApp claims in the WhisperStop verification queue and help fact-check them." />
      <header className="vq-head">
        <Badge tone="neutral" size="sm" icon={ShieldCheck}>
          Protected
        </Badge>
        <h2 className="vq-title display">Verification Queue</h2>
        <p className="vq-sub">
          Help the community by reviewing forwarded claims and submitting your
          verdict.
        </p>
      </header>

      <div className="vq-stats">
        <div className="vq-stat">
          <div className="vq-stat-num mono">{pending.length}</div>
          <div className="vq-stat-label">Pending Claims</div>
        </div>
        <div className="vq-stat">
          <div className="vq-stat-num mono">{verifiedToday}</div>
          <div className="vq-stat-label">Verified Today</div>
        </div>
        <div className="vq-stat">
          <div className="vq-stat-num mono">{accuracy}%</div>
          <div className="vq-stat-label">Your Accuracy</div>
        </div>
      </div>

      <div className="vq-toolbar">
        <div className="vq-filters">
          {FILTERS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={clsx("vq-pill", filter === key && "vq-pill--active")}
              onClick={() => setFilter(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="vq-sort-wrap">
          <select
            className="vq-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="oldest">Sort: Oldest First</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="vq-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="vq-item vq-item--skel">
              <Skeleton width={40} height={40} borderRadius={999} />
              <div className="vq-item-body" style={{ flex: 1 }}>
                <Skeleton
                  width={120}
                  height={22}
                  borderRadius={999}
                  style={{ marginBottom: 10 }}
                />
                <Skeleton
                  width="90%"
                  height={14}
                  borderRadius={6}
                  style={{ marginBottom: 8 }}
                />
                <Skeleton width={140} height={12} borderRadius={6} />
              </div>
              <Skeleton width={120} height={38} borderRadius={12} />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Queue is Clear!"
          description="No claims pending verification right now. Check back later!"
        />
      ) : (
        <div className="vq-list">
          {list.map((c) => (
            <div key={c.id} className="vq-item">
              <ProgressRing value={c.verificationCount} max={3} size={40} />
              <div className="vq-item-body">
                <div className="vq-item-tags">
                  <CategoryTag category={c.category} />
                  {c.isUrgent && (
                    <span className="vq-urgent">
                      <AlertTriangle size={12} /> URGENT
                    </span>
                  )}
                </div>
                <p className="vq-item-text">{c.text}</p>
                <span className="vq-item-meta mono">
                  Submitted {timeAgo(c.createdAt)} · {c.verificationCount}/3
                  verifiers
                </span>
              </div>
              <Link to={`/verify/${c.id}`} className="btn btn-primary btn-md">
                Verify This <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
