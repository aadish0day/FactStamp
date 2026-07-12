import { useState, useRef } from 'react';
import Seo from "../components/Seo.jsx";
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  CheckCircle, CheckCircle2, UploadCloud, X, ChevronDown, Search,
  HeartPulse, Landmark, BookHeart, Coins, ClipboardList, ShieldCheck, Type, Image, FileText,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ClaimCard from '../components/claim/ClaimCard.jsx';
import { useData } from '../context/DataContext.jsx';
import { toast } from "sonner";
import { detectDuplicate } from '../logic/duplicateDetection.js';
import './Submit.css';

const CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'political', label: 'Political' },
  { value: 'religious', label: 'Religious' },
  { value: 'financial', label: 'Financial' },
  { value: 'other', label: 'Other' },
];

const SAMPLE_TEXT =
  'BREAKING: Drinking water from the Ganga river cures all diseases including cancer. Share this miracle!';

export default function Submit() {
  const { claims, addClaim } = useData();
  const navigate = useNavigate();

  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('health');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | 'duplicate' | 'success'

  // image tab state
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [imgError, setImgError] = useState('');
  const fileInputRef = useRef(null);

  const charCount = text.length;
  const countColor =
    charCount > 800 ? 'var(--v-false)' : charCount > 500 ? 'var(--v-misleading)' : 'var(--text-3)';

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.warning('Paste a forward to check first');
      return;
    }
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const dup = detectDuplicate(text, claims);
    if (dup.isDuplicate && dup.matchedClaim) {
      setResult({ type: 'duplicate', claim: dup.matchedClaim });
    } else {
      const id = 'c' + Date.now();
      addClaim({
        id,
        text: text.trim(),
        imageUrl: null,
        submittedBy: 'u1',
        submitterName: 'Anonymous User',
        status: 'pending',
        verdict: null,
        confidenceScore: null,
        category,
        verificationCount: 0,
        createdAt: new Date().toISOString(),
        verifiedAt: null,
        viewCount: 0,
        isUrgent: false,
      });
      setResult({ type: 'success', id });
    }
    setLoading(false);
  };

  const onFile = (f) => {
    setImgError('');
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setImgError('File is too large. Max size is 5MB.');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleExtract = async () => {
    setExtracting(true);
    setExtracted(false);
    await new Promise((r) => setTimeout(r, 1500));
    setExtracting(false);
    setExtracted(true);
    setText(SAMPLE_TEXT);
    setCategory('health');
  };

  const resetAll = () => {
    setText('');
    setCategory('health');
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setExtracted(false);
    setImgError('');
  };

  return (
    <div className="submit-page container">
    <Seo title="WhisperStop | Submit a Claim" description="Submit a viral WhatsApp forward to WhisperStop and let the community verify it with sources." />
      <header className="submit-head">
        <Badge tone="neutral" size="sm" icon={ShieldCheck}>Protected Page</Badge>
        <h2 className="submit-title display">Check a Forward</h2>
        <p className="submit-sub">Paste a WhatsApp forward to check it against our verified database, or upload a screenshot.</p>
      </header>

      <Tabs
        tabs={[
          { key: 'text', label: 'Text Forward', icon: <Type size={14} /> },
          { key: 'image', label: 'Image Forward', icon: <Image size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="submit-body">
        {tab === 'text' && (
          <>
            {loading && (
              <div className="submit-loading">
                <Spinner size={28} />
                <span>Checking for duplicates...</span>
              </div>
            )}

            {!loading && !result && (
              <div className="submit-form">
                <Textarea
                  label="Forward Text"
                  placeholder="Paste the WhatsApp forward here — in any language..."
                  minHeight={180}
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="submit-charcount mono" style={{ color: countColor }}>
                  {charCount} characters
                </div>

                <div className="submit-field">
                  <label className="submit-label">Category</label>
                  <div className="submit-select-wrap">
                    <select
                      className="submit-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="submit-select-chevron" />
                  </div>
                </div>

                <Button variant="primary" size="xl" fullWidth onClick={handleCheck} icon={Search}>
                  Check This Forward
                </Button>
              </div>
            )}

            {!loading && result?.type === 'duplicate' && (
              <div className="submit-result duplicate">
                <CheckCircle size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <h3 className="submit-result-title display">This Forward Has Already Been Checked!</h3>
                  <p className="submit-result-desc">
                    We found an exact or near match in our verified database. Here's the existing fact-check.
                  </p>
                </div>
                <ClaimCard claim={result.claim} onClick={() => navigate(`/claim/${result.claim.id}`)} />
                <Button variant="primary" size="md" onClick={() => navigate(`/claim/${result.claim.id}`)}>
                  View Full Fact-Check →
                </Button>
              </div>
            )}

            {!loading && result?.type === 'success' && (
              <div className="submit-result success">
                <CheckCircle2 size={24} style={{ color: 'var(--v-true)' }} />
                <div>
                  <h3 className="submit-result-title display">Submitted for Verification!</h3>
                  <p className="submit-result-desc">
                    3 community verifiers will review this claim. You'll be notified once a consensus is reached.
                  </p>
                </div>
                <div className="submit-result-actions">
                  <Button variant="primary" size="md" onClick={() => navigate(`/claim/${result.id}`)}>
                    Track Claim Status →
                  </Button>
                  <Button variant="secondary" size="md" onClick={resetAll}>
                    Submit Another
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'image' && (
          <div className="submit-image">
            {!previewUrl && !extracting && !extracted && (
              <div
                className={clsx('dropzone', dragOver && 'dropzone--over')}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <UploadCloud size={40} style={{ color: 'var(--text-3)' }} />
                <p className="dropzone-title">Drag & drop your screenshot here</p>
                <p className="dropzone-or">or</p>
                <Button variant="secondary" size="md" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </div>
            )}

            {imgError && <p className="submit-img-error">{imgError}</p>}

            {extracting && (
              <div className="submit-loading">
                <Spinner size={28} />
                <span>Extracting text from image...</span>
              </div>
            )}

            {previewUrl && !extracting && (
              <div className="submit-preview">
                <img src={previewUrl} alt="upload preview" className="submit-preview-img" />
                <div className="submit-preview-meta">
                  <span className="mono">{file?.name}</span>
                  <span className="mono submit-preview-size">
                    {file ? (file.size / 1024).toFixed(0) : 0} KB
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => { setPreviewUrl(null); setFile(null); setExtracted(false); setText(''); }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              </div>
            )}

            {!extracted && previewUrl && !extracting && (
              <Button variant="primary" size="xl" fullWidth onClick={handleExtract} style={{ marginTop: 16 }}>
                Extract & Check
              </Button>
            )}

            {extracted && (
              <div className="submit-form">
                <label className="submit-label"><FileText size={14} /> Extracted Text</label>
                <span className="submit-ghost-note">Review before submitting</span>
                <Textarea
                  value={text}
                  readOnly
                  rows={5}
                  className="submit-readonly"
                  onChange={() => {}}
                />

                <div className="submit-field">
                  <label className="submit-label">Category</label>
                  <div className="submit-select-wrap">
                    <select
                      className="submit-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="submit-select-chevron" />
                  </div>
                </div>

                <div className="submit-img-actions">
                  <Button variant="primary" size="xl" fullWidth onClick={handleCheck} icon={CheckCircle2}>
                    Confirm & Submit
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => { setPreviewUrl(null); setFile(null); setExtracted(false); setText(''); }}
                  >
                    <X size={16} /> Re-upload Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
