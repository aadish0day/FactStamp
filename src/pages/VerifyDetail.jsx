import { useState, useEffect, useMemo } from 'react';
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowLeft, X, Search, ExternalLink, CheckCircle2, AlertTriangle,
  CheckCircle, XCircle, HelpCircle, Check,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Badge from '../components/ui/Badge.jsx';
import CategoryTag from '../components/claim/CategoryTag.jsx';
import VerdictBadge from '../components/claim/VerdictBadge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from "sonner";
import { timeAgo } from '../logic/formatDate.js';
import { sourceQuality, computeConfidence, consensusVerdict } from '../logic/confidenceScore.js';
import './VerifyDetail.css';

const VERDICTS = [
  {
    key: 'TRUE', Icon: CheckCircle, desc: 'The claim is factually accurate and verifiable',
    cls: 'vd-TRUE',
  },
  {
    key: 'FALSE', Icon: XCircle, desc: 'The claim is factually incorrect',
    cls: 'vd-FALSE',
  },
  {
    key: 'MISLEADING', Icon: AlertTriangle, desc: 'Partially true but deceptively presented',
    cls: 'vd-MISLEADING',
  },
  {
    key: 'UNVERIFIABLE', Icon: HelpCircle, desc: 'Cannot be confirmed or denied',
    cls: 'vd-UNVERIFIABLE',
  },
];

export default function VerifyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaim, getVerdicts, addVerdict, updateClaim } = useData();
  const { user } = useAuth();

  const claim = getClaim(id);
  const verdicts = getVerdicts(id);

  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(true);

  const [quality, setQuality] = useState(null); // {level, score}
  const [qualityLoading, setQualityLoading] = useState(false);

  const alreadyVerified = useMemo(
    () => verdicts.some((v) => v.uid === user?.uid),
    [verdicts, user]
  );
  const myPreviousVerdict = useMemo(
    () => verdicts.find((v) => v.uid === user?.uid),
    [verdicts, user]
  );

  // Debounced source-quality analysis
  useEffect(() => {
    if (!source) {
      setQuality(null);
      setQualityLoading(false);
      return;
    }
    setQualityLoading(true);
    const t = setTimeout(() => {
      const valid = /^https:\/\//i.test(source);
      if (!valid) {
        setQuality({ level: 'invalid' });
      } else {
        setQuality(sourceQuality(source));
      }
      setQualityLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [source]);

  if (!claim) {
    return (
      <div className="vd-page container">
    <Helmet><title>WhisperStop | Verify a Claim</title></Helmet>
        <Link to="/verify" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back to Queue</Link>
        <div className="vd-missing">
          <h2 className="display">Claim Not Found</h2>
          <p>This claim may have been removed or never existed.</p>
          <Link to="/verify" className="btn btn-primary">← Back to Queue</Link>
        </div>
      </div>
    );
  }

  const isOwn = claim.submittedBy && user && claim.submittedBy === user.uid;
  const isResolved = claim.status !== 'pending';

  const explanationValid = explanation.trim().length >= 50;
  const sourceValid = !!source && /^https:\/\//i.test(source) && quality && quality.level !== 'invalid';
  const canSubmit = selected && sourceValid && explanationValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));

    const newVerdict = {
      uid: user.uid,
      verdict: selected,
      sourceUrl: source,
      explanation: explanation.trim(),
      verifierReputation: user.reputation || 50,
      submittedAt: new Date().toISOString(),
    };

    addVerdict(claim.id, newVerdict);

    if (claim.verificationCount + 1 >= 3) {
      const all = [...verdicts, newVerdict];
      const consensus = consensusVerdict(all);
      const score = computeConfidence(all, source);
      updateClaim(claim.id, {
        status: consensus.contested ? 'contested' : 'verified',
        verdict: consensus.verdict,
        confidenceScore: score,
        verifiedAt: new Date().toISOString(),
      });
      toast.success(`Consensus reached! Claim verified as ${consensus.verdict}.`);
    } else {
      toast.success(`Verdict submitted! ${3 - (claim.verificationCount + 1)} more verifier(s) needed.`);
    }
    setSubmitting(false);
    setTimeout(() => navigate('/verify'), 1500);
  };

  return (
    <div className="vd-page container">
      <Link to="/verify" className="btn btn-ghost btn-sm vd-back"><ArrowLeft size={16} /> Back to Queue</Link>

      {isOwn && (
        <div className="vd-guard vd-guard-warn">
          <AlertTriangle size={20} />
          <div>
            <h3 className="vd-guard-title">You can't verify your own submission.</h3>
            <p className="vd-guard-desc">Community verification requires independent reviewers. Submitters are excluded by design.</p>
          </div>
        </div>
      )}

      {!isOwn && isResolved && (
        <div className="vd-guard vd-guard-info">
          <CheckCircle2 size={20} />
          <div>
            <h3 className="vd-guard-title">This claim has been {claim.status === 'verified' ? 'verified' : 'contested'}.</h3>
            <p className="vd-guard-desc">See the final result below.</p>
            <Link to={`/claim/${claim.id}`} className="btn btn-primary btn-sm">View Fact-Check →</Link>
          </div>
        </div>
      )}

      {!isOwn && !isResolved && alreadyVerified && (
        <div className="vd-guard vd-guard-info">
          <CheckCircle2 size={20} />
          <div>
            <h3 className="vd-guard-title">You already submitted a verdict for this claim.</h3>
            <div className="vd-guard-verdict">
              <VerdictBadge verdict={myPreviousVerdict?.verdict} size="sm" />
            </div>
          </div>
        </div>
      )}

      <div className="vd-grid">
        <div className="vd-left">
          <div className="vd-status">
            <CategoryTag category={claim.category} />
            {claim.isUrgent && (
              <span className="vd-urgent">
                <AlertTriangle size={12} /> URGENT
              </span>
            )}
            <span className="vd-bullet">•</span>
            <span className="vd-time mono">Submitted {timeAgo(claim.createdAt)}</span>
          </div>
          <div className="vd-claim-card">
            <p className="vd-claim-text">{claim.text}</p>
            <div className="vd-claim-meta mono">
              Submitted by {claim.submitterName} · {claim.viewCount} views
            </div>
            <div className="vd-claim-id mono">Claim ID: {claim.id}</div>
          </div>
        </div>

        <aside className="vd-right">
          {!isOwn && !isResolved && !alreadyVerified && (
            <div className="vd-form-card">
              {rulesOpen && (
                <div className="vd-rules">
                  <div className="vd-rules-head">
                    <span className="vd-rules-title"><AlertTriangle size={14} /> Verifier Rules</span>
                    <button className="vd-rules-close" onClick={() => setRulesOpen(false)} aria-label="Dismiss">
                      <X size={14} />
                    </button>
                  </div>
                  <ul className="vd-rules-list">
                    <li>Don't look up other verdicts before submitting</li>
                    <li>Always cite a credible source</li>
                    <li>Be objective, not emotional</li>
                  </ul>
                </div>
              )}

              <h3 className="vd-form-title">Select Your Verdict</h3>
              <div className="vd-verdicts">
                {VERDICTS.map(({ key, Icon, desc, cls }) => (
                  <button
                    key={key}
                    type="button"
                    className={clsx('vd-verdict', cls, selected === key && 'vd-verdict--active')}
                    onClick={() => setSelected(key)}
                  >
                    <span className="vd-verdict-icon"><Icon size={20} /></span>
                    <span className="vd-verdict-body">
                      <span className="vd-verdict-word">{key}</span>
                      <span className="vd-verdict-desc">{desc}</span>
                    </span>
                    {selected === key && <span className="vd-verdict-check"><Check size={14} /></span>}
                  </button>
                ))}
              </div>

              <div className="vd-field">
                <Input
                  label="Supporting Source URL *"
                  placeholder="https://who.int/... or https://wikipedia.org/..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  error={source && quality?.level === 'invalid' ? 'Enter a valid URL starting with https://' : undefined}
                />
                {qualityLoading && source && (
                  <div className="vd-quality">
                    <Spinner size={12} /> <span>Analyzing source...</span>
                  </div>
                )}
                {!qualityLoading && quality && quality.level === 'high' && (
                  <div className="vd-quality vd-quality-high"><CheckCircle2 size={13} /> High-quality source</div>
                )}
                {!qualityLoading && quality && quality.level === 'medium' && (
                  <div className="vd-quality vd-quality-med"><CheckCircle2 size={13} /> Credible source</div>
                )}
                {!qualityLoading && quality && quality.level === 'low' && (
                  <div className="vd-quality vd-quality-low"><AlertTriangle size={13} /> Unverified source — proceed with caution</div>
                )}
                {!qualityLoading && quality && quality.level === 'invalid' && (
                  <div className="vd-quality vd-quality-low"><XCircle size={13} /> Enter a valid URL starting with https://</div>
                )}
              </div>

              <div className="vd-field">
                <Textarea
                  label="Your Explanation *"
                  placeholder="Explain in 2–3 sentences why you believe this claim is ..."
                  minHeight={120}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  error={explanation && !explanationValid ? 'Please write at least 50 characters' : undefined}
                />
                <div className="vd-charcount mono" style={{ color: explanationValid ? 'var(--v-true)' : 'var(--v-false)' }}>
                  {explanation.trim().length}/50 minimum
                </div>
              </div>

              <Button
                variant="primary"
                size="xl"
                fullWidth
                disabled={!canSubmit}
                loading={submitting}
                onClick={handleSubmit}
              >
                Submit Verdict
              </Button>
            </div>
          )}

          {!isOwn && !isResolved && alreadyVerified && (
            <div className="vd-form-card vd-done">
              <CheckCircle2 size={32} style={{ color: 'var(--v-true)' }} />
              <h3 className="vd-done-title display">Verdict Recorded</h3>
              <p className="vd-done-desc">Thanks for contributing. You'll be notified when consensus is reached.</p>
              <VerdictBadge verdict={myPreviousVerdict?.verdict} size="md" />
            </div>
          )}

          {isResolved && (
            <Link to={`/claim/${claim.id}`} className="btn btn-primary btn-xl btn-full">View Full Fact-Check →</Link>
          )}
        </aside>
      </div>
    </div>
  );
}
