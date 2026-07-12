import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Check } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Register.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    <div className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="auth-card auth-card--wide">
        <div className="auth-logo display">
          <ShieldAlert size={22} className="auth-logo-icon" /> WhisperStop
        </div>
        <p className="auth-tag">Join the fight against misinformation.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="reg-name"
            label="Full Name"
            placeholder="Your full name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />
          <Input
            id="reg-email"
            label="Email Address"
            type="email"
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
          Continue with Google
        </Button>

        <p className="auth-foot">
          Already have an account? <Link to="/login" className="auth-foot-link">Sign In →</Link>
        </p>
      </div>
    </div>
  );
}
