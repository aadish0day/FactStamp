import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowLeft, ExternalLink, CheckCircle2, BookOpen, AlertTriangle, Download, Clock, RefreshCw, Check } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import VerdictStamp from "../components/claim/VerdictStamp.jsx";
import ConfidenceBar from "../components/claim/ConfidenceBar.jsx";
import CategoryTag from "../components/claim/CategoryTag.jsx";
import FactCheckCard from "../components/claim/FactCheckCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { timeAgo } from "../logic/formatDate.js";
import { sourceQuality } from "../logic/confidenceScore.js";
import { generateCard } from "../logic/cardGenerator.js";
import "./ClaimDetail.css";

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const STATUS_DOT = {
  pending: "var(--v-pending)",
  verified: "var(--v-true)",
  contested: "var(--v-contested)",
};

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaim, getVerdicts } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const claim = getClaim(id);
  const verdicts = getVerdicts(id);
  const [downloading, setDownloading] = useState(false);

  if (!claim) {
    return (
      <div className="cd-page container">
        <Link to="/verify" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> All Claims
        </Link>
        <div className="cd-missing">
          <h2 className="display">Claim Not Found</h2>
          <p>
            The claim you're looking for doesn't exist or may have been removed.
          </p>
          <Link to="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwn = claim.submittedBy && user && claim.submittedBy === user.uid;
  const statusText =
    claim.status === "verified"
      ? `Verified · ${claim.verdict}`
      : claim.status === "contested"
        ? "Contested"
        : "Pending Verification";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateCard(claim.id);
      toast.success("Card downloaded! Share it on WhatsApp");
    } catch {
      toast.error("Could not generate card");
    }
    setDownloading(false);
  };

  const sources = verdicts.map((v) => v.sourceUrl).filter(Boolean);
  const explanation = verdicts
    .map((v) => v.explanation)
    .filter(Boolean)
    .join(" ");

  return (
    <div className="cd-page container">
      <Link to="/verify" className="btn btn-ghost btn-sm cd-back">
        <ArrowLeft size={16} /> All Claims
      </Link>

      <div className="cd-grid">
        <div className="cd-left">
          <div className="cd-status">
            <span
              className="cd-dot"
              style={{
                background: STATUS_DOT[claim.status] || "var(--text-3)",
              }}
            />
            <span className="cd-status-text">{statusText}</span>
            <CategoryTag category={claim.category} />
            <span className="cd-bullet">•</span>
            <span className="cd-time mono">
              Submitted {timeAgo(claim.createdAt)}
            </span>
          </div>

          <div className="cd-claim-card">
            <p className="cd-claim-text">{claim.text}</p>
            <div className="cd-claim-meta mono">
              Submitted by {claim.submitterName} · {claim.viewCount} views
            </div>
            <div className="cd-claim-id mono">Claim ID: {claim.id}</div>
          </div>

          {claim.status === "verified" && sources.length > 0 && (
            <div className="cd-sources">
              <h3 className="cd-subhead"><BookOpen size={15} /> Verified Sources</h3>
              <div className="cd-source-chips">
                {sources.map((url, i) => {
                  const sq = sourceQuality(url);
                  return (
                    <span key={i} className="cd-source-chip">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="cd-source-link"
                      >
                        {domainOf(url)} <ExternalLink size={10} />
                      </a>
                      <span
                        className={clsx(
                          "cd-source-quality",
                          sq.level === "high" ? "cd-sq-high" : "cd-sq-low",
                        )}
                      >
                        {sq.level === "high" ? <><CheckCircle2 size={12} /> High</> : <><AlertTriangle size={12} /> Unverified</>}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {claim.status === "verified" && (
            <div className="cd-explanation">
              <h3 className="cd-subhead">Community Explanation</h3>
              <blockquote className="cd-quote">{explanation}</blockquote>
            </div>
          )}
        </div>

        <aside className="cd-right">
          {claim.status === "verified" && (
            <div className="cd-verified-card">
              <VerdictStamp verdict={claim.verdict} claimId={claim.id} />
              <ConfidenceBar score={claim.confidenceScore} label />
              <div className="cd-verified-count mono">
                Verified by {claim.verificationCount} community members
              </div>
              {claim.verifiedAt && (
                <div className="cd-verified-time mono">
                  Verified {timeAgo(claim.verifiedAt)}
                </div>
              )}
                <Button
                  variant="primary"
                  size="xl"
                  fullWidth
                  onClick={handleDownload}
                  loading={downloading}
                  icon={Download}
                >
                  Download Fact-Check Card
                </Button>
              <p className="cd-hint">
                Share this card back in the same WhatsApp group to stop the
                spread.
              </p>
            </div>
          )}

          {claim.status === "pending" && (
            <div className="cd-pending-card">
              <h3 className="cd-pending-title"><Clock size={16} /> Awaiting Verification</h3>
              <div className="cd-pending-row">
                <span className="cd-pending-label">Community Verifiers</span>
                <span className="cd-pending-count mono">
                  {claim.verificationCount}/3 submitted
                </span>
              </div>
              <div className="cd-avatars">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={clsx(
                      "cd-avatar",
                      i <= claim.verificationCount && "cd-avatar--filled",
                    )}
                  >
                    {i <= claim.verificationCount && <Check size={16} />}
                  </span>
                ))}
              </div>
              <div className="cd-progress">
                <div
                  className="cd-progress-fill"
                  style={{
                    width: `${Math.min(100, (claim.verificationCount / 3) * 100)}%`,
                  }}
                />
              </div>
              {isOwn ? (
                <Button variant="secondary" size="xl" fullWidth disabled>
                  You can't verify your own submission
                </Button>
              ) : (
                <Link
                  to={`/verify/${claim.id}`}
                  className="btn btn-primary btn-xl btn-full"
                >
                  Be a Verifier →
                </Link>
              )}
            </div>
          )}

          {claim.status === "contested" && (
            <div className="cd-contested-card">
              <h3 className="cd-contested-title"><RefreshCw size={16} /> No Consensus Reached</h3>
              <p className="cd-contested-desc">
                Verifiers could not reach agreement on this claim. It remains
                under review by senior moderators.
              </p>
              <details className="cd-accordion">
                <summary>What does this mean?</summary>
                <p>
                  When at least 3 verifiers submit conflicting verdicts without
                  a majority, the claim is marked contested. A contested claim
                  isn't shown as a definitive fact-check until moderators
                  resolve it.
                </p>
              </details>
            </div>
          )}
        </aside>
      </div>

      <FactCheckCard claim={claim} verdicts={verdicts} />
    </div>
  );
}
