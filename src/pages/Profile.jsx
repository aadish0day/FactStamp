import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, CheckCircle2, XCircle, Sprout, Gem, Trophy, Star, ClipboardList, Scale } from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import ClaimCard from '../components/claim/ClaimCard.jsx';
import VerdictBadge from '../components/claim/VerdictBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { MOCK_MY_SUBMISSIONS, MOCK_MY_VERIFICATIONS } from '../data/mockData.js';
import { formatMemberSince, timeAgo } from '../logic/formatDate.js';
import './Profile.css';

function repLevel(rep) {
  if (rep <= 30) return { label: 'Novice', icon: Sprout, color: 'var(--v-false)' };
  if (rep <= 60) return { label: 'Trusted', icon: Star, color: 'var(--accent)' };
  if (rep <= 85) return { label: 'Expert', icon: Gem, color: 'var(--v-true)' };
  return { label: 'Elite', icon: Trophy, color: 'var(--v-misleading)' };
}

export default function Profile() {
  const { user } = useAuth();
  const { claims } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('submissions');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState(user?.displayName || '');

  const submissions = MOCK_MY_SUBMISSIONS.map((id) => claims.find((c) => c.id === id)).filter(Boolean);
  const verifications = MOCK_MY_VERIFICATIONS.map((v) => ({ ...v, claim: claims.find((c) => c.id === v.claimId) })).filter((v) => v.claim);

  const rep = user?.reputation || 0;
  const level = repLevel(rep);
  const nextLevel = rep <= 30 ? 31 : rep <= 60 ? 61 : rep <= 85 ? 86 : 100;
  const toNext = rep >= 86 ? 0 : nextLevel - rep;

  const acc = user?.totalVerifications
    ? Math.round((user.correctVerifications / user.totalVerifications) * 100)
    : 0;

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    toast.success('Profile updated successfully');
    setModalOpen(false);
  };

  return (
    <div className="pf-page container">
      <div className="pf-head-card">
        <Avatar name={user?.displayName || '?'} size={56} />
        <div className="pf-head-info">
          <h2 className="pf-name display">{user?.displayName}</h2>
          <div className="pf-email mono">{user?.email}</div>
          <div className="pf-since mono">Member since {formatMemberSince(user?.joinedAt)}</div>
        </div>
        <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setModalOpen(true)}>
          Edit Profile
        </Button>
      </div>

      <div className="pf-rep-card">
        <div className="pf-rep-title"><Star size={16} /> Reputation Score</div>
        <div className="pf-rep-score" style={{ color: level.color }}>{rep}</div>
        <div className="pf-rep-bar">
          <div className="pf-rep-fill" style={{ width: `${rep}%` }} />
        </div>
        <div className="pf-rep-level" style={{ color: level.color }}>
          <level.icon size={16} /> {level.label}
        </div>
        <div className="pf-rep-next">{toNext > 0 ? `Next level in ${toNext} points` : 'Maximum level reached'}</div>
      </div>

      <div className="pf-stats">
        <div className="pf-stat">
          <div className="pf-stat-num mono">{user?.submittedClaims}</div>
          <div className="pf-stat-label">Claims Submitted</div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-num mono">{user?.totalVerifications}</div>
          <div className="pf-stat-label">Verdicts Given</div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-num mono">{user?.correctVerifications}</div>
          <div className="pf-stat-label">Correct Verdicts</div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-num mono" style={{ color: 'var(--accent)' }}>{acc}%</div>
          <div className="pf-stat-label">Accuracy Rate</div>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'submissions', label: 'My Submissions', icon: <ClipboardList size={14} /> },
          { key: 'verifications', label: 'My Verifications', icon: <Scale size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'submissions' && (
        <div className="pf-grid">
          {submissions.length === 0 ? (
            <p className="pf-empty">You haven't submitted any claims yet.</p>
          ) : (
            submissions.map((c) => (
              <ClaimCard key={c.id} claim={c} onClick={() => navigate(`/claim/${c.id}`)} />
            ))
          )}
        </div>
      )}

      {tab === 'verifications' && (
        <div className="pf-verifs">
          {verifications.map((v) => (
            <div key={v.claimId} className="pf-verif">
              <VerdictBadge verdict={v.myVerdict} size="sm" />
              <button className="pf-verif-text" onClick={() => navigate(`/claim/${v.claimId}`)}>
                {v.claim.text}
              </button>
              <span className="pf-verif-time mono">{timeAgo(v.claim.createdAt)}</span>
              <span className={v.matched ? 'pf-verif-match pf-verif-match--ok' : 'pf-verif-match pf-verif-match--no'}>
                {v.matched ? <><CheckCircle2 size={13} /> Matched (+{v.reputationDelta})</> : <><XCircle size={13} /> Didn't match ({v.reputationDelta})</>}
              </span>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit Profile">
        <Input
          label="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <Button variant="primary" fullWidth onClick={handleSave} style={{ marginTop: 16 }}>
          Save Changes
        </Button>
      </Modal>
    </div>
  );
}
