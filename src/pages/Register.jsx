import { useState, useEffect } from 'react';
import Seo from "../components/Seo.jsx";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Register.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

const PW_REQS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: '12+ characters (strong)', test: (p) => p.length >= 12 },
];

const STR_META = [
  { label: '', color: 'var(--border-strong)' },
  { label: 'Weak', color: 'var(--v-false)' },
  { label: 'Flimsy', color: 'var(--v-misleading)' },
  { label: 'Solid', color: 'var(--v-pending)' },
  { label: 'Bulletproof', color: 'var(--v-true)' },
];

const FIELDS = {
  name: { label: 'Full Name', id: 'reg-name' },
  email: { label: 'Email Address', id: 'reg-email' },
  password: { label: 'Password', id: 'reg-pass' },
  confirm: { label: 'Confirm Password', id: 'reg-confirm' },
  agree: { label: 'Agreement', id: null },
};

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('reg-name')?.focus());
  }, []);

  const fieldError = (name) => {
    if (name === 'name') {
      if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      if (!form.email.trim()) return 'Email address is required';
      if (!EMAIL_RE.test(form.email)) return 'Please enter a valid email address';
    }
    if (name === 'password') {
      if (!PW_RE.test(form.password)) return 'Must be 8+ characters with 1 uppercase and 1 number';
    }
    if (name === 'confirm') {
      if (form.confirm !== form.password) return 'Passwords do not match';
    }
    if (name === 'agree') {
      if (!agree) return 'Please agree to verify honestly';
    }
    return '';
  };

  const revalidate = (name) => setErrors((p) => ({ ...p, [name]: fieldError(name) }));

  const onChange = (name, value, setter) => {
    setter(value);
    if (touched[name]) revalidate(name);
  };

  const onBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    revalidate(name);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    setTouched({ name: true, email: true, password: true, confirm: true, agree: true });
    const e = {};
    ['name', 'email', 'password', 'confirm', 'agree'].forEach((k) => {
      const msg = fieldError(k);
      if (msg) e[k] = msg;
    });
    setErrors(e);
    if (Object.keys(e).length) {
      const firstBadKey = ['name', 'email', 'password', 'confirm', 'agree'].find((k) => e[k]);
      const firstId = FIELDS[firstBadKey]?.id;
      if (firstId) document.getElementById(firstId)?.focus();
      return;
    }
    setLoading(true);
    await register(form.name, form.email, form.password);
    navigate(from, { replace: true });
  };

  const handleGoogle = () => {
    loginWithGoogle();
    navigate(from, { replace: true });
  };

  const metCount = PW_REQS.filter((r) => r.test(form.password)).length;
  const pwPct = (metCount / PW_REQS.length) * 100;
  const pwColor = STR_META[metCount].color;

  const summaryItems = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([key, msg]) => ({ key, msg, field: FIELDS[key] }));

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Join FactStamp to submit and verify suspicious forwards."
    >
      <Seo title="FactStamp | Create Account" description="Create a FactStamp account to submit suspicious forwards and join community fact-checking." />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {submitted && summaryItems.length > 0 && (
          <div className="auth-summary" role="alert">
            <strong>Please fix the following:</strong>
            <ul>
              {summaryItems.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    className="auth-summary-link"
                    onClick={() => it.field?.id && document.getElementById(it.field.id)?.focus()}
                  >
                    {it.field?.label || it.key}: {it.msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Input
          id="reg-name"
          label="Full Name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value, (v) => setForm((p) => ({ ...p, name: v })))}
          onBlur={() => onBlur('name')}
          error={touched.name ? errors.name : undefined}
          success={touched.name && !errors.name && form.name ? 'Looks good' : undefined}
        />
        <Input
          id="reg-email"
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value, (v) => setForm((p) => ({ ...p, email: v })))}
          onBlur={() => onBlur('email')}
          error={touched.email ? errors.email : undefined}
          success={touched.email && !errors.email && form.email ? 'Valid email' : undefined}
        />
        <div>
          <Input
            id="reg-pass"
            label="Password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value, (v) => setForm((p) => ({ ...p, password: v })))}
            onBlur={() => onBlur('password')}
            error={touched.password ? errors.password : undefined}
          />
          {form.password && (
            <div className="pw-meter">
              <div className="pw-meter-head">
                <span className="pw-meter-label">Stamp confidence</span>
                <span className="pw-meter-tag" style={{ color: pwColor }}>
                  {STR_META[metCount].label || '—'}
                </span>
              </div>
              <div className="pw-bar">
                <span className="pw-bar-fill" style={{ width: `${pwPct}%`, background: pwColor }} />
              </div>
              <ul className="pw-reqs">
                {PW_REQS.map((r) => {
                  const met = r.test(form.password);
                  return (
                    <li key={r.label} className={met ? 'met' : ''}>
                      <Check size={12} strokeWidth={3} /> {r.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <Input
          id="reg-confirm"
          label="Confirm Password"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={(e) => onChange('confirm', e.target.value, (v) => setForm((p) => ({ ...p, confirm: v })))}
          onBlur={() => onBlur('confirm')}
          error={touched.confirm ? errors.confirm : undefined}
          success={touched.confirm && !errors.confirm && form.confirm ? 'Passwords match' : undefined}
        />

        <label className="auth-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              if (touched.agree) revalidate('agree');
            }}
          />
          <span className="auth-check-box" aria-hidden="true">
            {agree && <Check size={13} strokeWidth={3} />}
          </span>
          <span className="auth-check-text">
            I agree to verify claims honestly and provide credible sources.
          </span>
        </label>
        {errors.agree && <p className="auth-error-line">{errors.agree}</p>}

        <Button variant="primary" size="xl" fullWidth type="submit" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="auth-divider"><span>OR</span></div>

      <Button variant="secondary" size="xl" fullWidth onClick={handleGoogle}>
        <GoogleIcon /> Continue with Google
      </Button>

      <p className="auth-foot">
        Already have an account? <Link to="/login" className="auth-foot-link">Sign In →</Link>
      </p>

      <div className="auth-footnote">
        <span className="auth-trust"><Lock size={13} /> Secured &amp; encrypted</span>
        <span className="auth-legal">
          <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
