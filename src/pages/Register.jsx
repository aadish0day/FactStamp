import { useState } from 'react';
import Seo from "../components/Seo.jsx";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Register.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function strengthOf(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(4, score);
}

const STR_META = [
  { label: '', color: 'var(--border-strong)' },
  { label: 'Weak', color: 'var(--v-false)' },
  { label: 'Fair', color: 'var(--v-misleading)' },
  { label: 'Good', color: 'var(--v-pending)' },
  { label: 'Strong', color: 'var(--v-true)' },
];

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const strength = strengthOf(form.password);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Please enter a valid email address';
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password))
      e.password = 'Must be 8+ characters with 1 uppercase and 1 number';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    if (!agree) e.agree = 'Please agree to verify honestly';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await register(form.name, form.email, form.password);
    navigate(from, { replace: true });
  };

  const handleGoogle = () => {
    loginWithGoogle();
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Join FactStamp to submit and verify suspicious forwards."
    >
      <Seo title="FactStamp | Create Account" description="Create a FactStamp account to submit suspicious forwards and join community fact-checking." />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="reg-name"
          label="Full Name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <Input
          id="reg-email"
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
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
            onChange={set('password')}
            error={errors.password}
          />
          {form.password && (
            <div className="pw-meter">
              <div className="pw-bars">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="pw-seg"
                    style={{ background: i <= strength ? STR_META[strength].color : 'var(--border-strong)' }}
                  />
                ))}
              </div>
              <span className="pw-label" style={{ color: STR_META[strength].color }}>
                {STR_META[strength].label}
              </span>
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
          onChange={set('confirm')}
          error={errors.confirm}
        />

        <label className="auth-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
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
    </AuthLayout>
  );
}
