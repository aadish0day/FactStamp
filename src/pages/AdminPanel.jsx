import { useMemo, useState } from "react";
import Seo from "../components/Seo.jsx";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Scale,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  Flame,
} from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";
import VerdictBadge from "../components/claim/VerdictBadge.jsx";
import CategoryTag from "../components/claim/CategoryTag.jsx";
import { MOCK_CLAIMS } from "../data/mockData.js";
import "./AdminPanel.css";

const FILTERS = [
  { key: "all", label: "All", color: "var(--accent)" },
  { key: "pending", label: "Pending", color: "var(--v-pending)" },
  { key: "verified", label: "Verified", color: "var(--v-true)" },
  { key: "contested", label: "Contested", color: "var(--v-contested)" },
  { key: "urgent", label: "Urgent", color: "var(--v-false)" },
];

export default function AdminPanel() {
  const { claims, updateClaim, removeClaim } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const summary = useMemo(() => {
    const all = MOCK_CLAIMS;
    return {
      total: all.length,
      pending: all.filter((c) => c.status === "pending").length,
      verified: all.filter((c) => c.status === "verified").length,
      contested: all.filter((c) => c.status === "contested").length,
      urgent: all.filter((c) => c.isUrgent).length,
    };
  }, []);

  const filtered = useMemo(() => {
    let list = claims;
    if (filter === "urgent") list = list.filter((c) => c.isUrgent);
    else if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [claims, filter, query]);

  const copyId = (id) => {
    try {
      navigator.clipboard.writeText(id);
    } catch (e) {}
    toast.success(`Claim ID ${id} copied`);
  };

  const toggleUrgent = (c) => {
    updateClaim(c.id, { isUrgent: !c.isUrgent });
    toast.info(
      c.isUrgent ? "Removed urgent flag" : "Marked claim as urgent",
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeClaim(deleteTarget.id);
    toast.success("Claim deleted");
    setDeleteTarget(null);
  };

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Weekly report generated and saved.");
    }, 1500);
  };

  const mini = (icon, label, value, color) => (
    <div className="ad-mini" key={label}>
      <span className="ad-mini-icon" style={{ color }}>
        {icon}
      </span>
      <span className="ad-mini-value mono" style={{ color }}>
        {value}
      </span>
      <span className="ad-mini-label">{label}</span>
    </div>
  );

  return (
    <div className="ad-page container">
    <Seo title="FactStamp | Admin" description="FactStamp admin tools to moderate claims, users and categories." />
      <header className="ad-head">
        <div>
          <h2 className="ad-title display">
          <ShieldCheck size={26} /> Admin Control Panel
        </h2>
          <span className="ad-email mono">{user?.email}</span>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={FileSpreadsheet}
          loading={generating}
          onClick={generateReport}
        >
          Generate Weekly Report
        </Button>
      </header>

      <div className="ad-summary">
        {mini(<FileText size={16} />, "Total", summary.total, "var(--accent)")}
        {mini(<Clock size={16} />, "Pending", summary.pending, "var(--v-pending)")}
        {mini(
          <CheckCircle2 size={16} />,
          "Verified",
          summary.verified,
          "var(--v-true)",
        )}
        {mini(<Scale size={16} />, "Contested", summary.contested, "var(--v-contested)")}
        {mini(
          <AlertTriangle size={16} />,
          "Urgent",
          summary.urgent,
          "var(--v-false)",
        )}
      </div>

      <div className="ad-toolbar">
        <div className="ad-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`ad-pill ${filter === f.key ? "ad-pill-active" : ""}`}
              style={
                filter === f.key
                  ? { background: f.color, borderColor: f.color, color: "#fff" }
                  : undefined
              }
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ad-search">
          <Input
            prefix={<Search size={16} />}
            placeholder="Search claims..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Text</th>
              <th>Category</th>
              <th>Status</th>
              <th>Verifiers</th>
              <th>Urgent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="ad-row">
                <td>
                  <button
                    className="ad-id mono"
                    onClick={() => copyId(c.id)}
                    title="Copy ID"
                  >
                    {c.id}
                  </button>
                </td>
                <td className="ad-text">{c.text}</td>
                <td>
                  <CategoryTag category={c.category} />
                </td>
                <td>
                  {c.status === "verified" ? (
                    <VerdictBadge verdict={c.verdict} size="sm" />
                  ) : c.status === "contested" ? (
                    <Badge tone="contested" size="sm">
                      CONTESTED
                    </Badge>
                  ) : (
                    <Badge tone="pending" size="sm">
                      PENDING
                    </Badge>
                  )}
                </td>
                <td className="mono">{c.verificationCount}/3</td>
                <td>
                  <span className={`ad-toggle ${c.isUrgent ? "ad-toggle-on" : ""}`}>
                    {c.isUrgent ? "ON" : "OFF"}
                  </span>
                </td>
                <td className="ad-actions">
                  <button
                    className={`ad-action ${c.isUrgent ? "ad-action-danger" : "ad-action-accent"}`}
                    onClick={() => toggleUrgent(c)}
                  >
                    {c.isUrgent ? (
                      <>
                        <Flame size={13} /> Remove Urgent
                      </>
                    ) : (
                      <>
                        <Flame size={13} /> Mark Urgent
                      </>
                    )}
                  </button>
                  <Button
                    variant="danger"
                    size="xs"
                    icon={Trash2}
                    onClick={() => setDeleteTarget(c)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="ad-empty">
                  No claims match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Claim"
        size="sm"
      >
        <p className="ad-modal-text">
          Are you sure you want to delete this claim? This action cannot be
          undone.
        </p>
        <div className="ad-modal-actions">
          <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="md" icon={Trash2} onClick={confirmDelete}>
            Delete Claim
          </Button>
        </div>
      </Modal>
    </div>
  );
}
