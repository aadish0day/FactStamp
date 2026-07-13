import { useState, useEffect } from 'react';
import Seo from "../components/Seo.jsx";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Modal from '../components/ui/Modal.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELDS = {
  email: { label: 'Email Address', id: 'login-email' },
  password: { label: 'Password', id: 'login-pass' },
};

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

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('login-email')?.focus());
  }, []);

  const fieldError = (name) => {
    if (name === 'email') {
      if (!email.trim()) return 'Email address is required';
      if (!EMAIL_RE.test(email)) return 'Please enter a valid email address';
    }
    if (name === 'password') {
      if (!password) return 'Password is required';
    }
    return '';
  };

  const revalidate = (name) => {
    setErrors((p) => ({ ...p, [name]: fieldError(name) }));
  };

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
    setTouched({ email: true, password: true });
    const e = {};
    if (fieldError('email')) e.email = fieldError('email');
    if (fieldError('password')) e.password = fieldError('password');
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(e.email ? 'login-email' : 'login-pass')?.focus();
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setLoading(false);
      setErrors((p) => ({ ...p, login: err.message || 'Incorrect email or password. Try again.' }));
    }
  };

  const handleGoogle = () => {
    loginWithGoogle();
    navigate(from, { replace: true });
  };

  const handleReset = () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    toast.success('Reset link sent!');
    setResetSent(true);
    setTimeout(() => {
      setResetOpen(false);
      setResetSent(false);
      setResetEmail('');
    }, 1200);
  };

  const summaryItems = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([key, msg]) => ({ key, msg, field: FIELDS[key] }));

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Log in to verify claims and contribute to the community."
    >
      <Seo title="FactStamp | Log In" description="Log in to FactStamp to submit and verify WhatsApp claims with the community." />
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
          id="login-email"
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onChange('email', e.target.value, setEmail)}
          onBlur={() => onBlur('email')}
          error={touched.email ? errors.email : undefined}
          success={touched.email && !errors.email && email ? 'Valid email' : undefined}
        />
        <Input
          id="login-pass"
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onChange('password', e.target.value, setPassword)}
          onBlur={() => onBlur('password')}
          error={touched.password ? errors.password : undefined}
          success={touched.password && !errors.password && password ? 'Looks good' : undefined}
        />
        {errors.login && <p className="auth-error-line">{errors.login}</p>}

        <div className="auth-row">
          <span />
          <button type="button" className="auth-link" onClick={() => setResetOpen(true)}>
            Forgot password?
          </button>
        </div>

        <Button variant="primary" size="xl" fullWidth type="submit" loading={loading}>
          Sign In
        </Button>
      </form>

      <div className="auth-divider"><span>OR</span></div>

      <Button variant="secondary" size="xl" fullWidth onClick={handleGoogle}>
        <GoogleIcon /> Continue with Google
      </Button>

      <p className="auth-foot">
        Don't have an account? <Link to="/register" className="auth-foot-link">Register →</Link>
      </p>

      <div className="auth-footnote">
        <span className="auth-trust"><Lock size={13} /> Secured &amp; encrypted</span>
        <span className="auth-legal">
          <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
        </span>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Password">
        <p className="auth-modal-desc">Enter your email and we'll send you a link to reset your password.</p>
        <Input
          id="reset-email"
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <Button variant="primary" fullWidth onClick={handleReset}>
          Send Reset Link
        </Button>
      </Modal>
    </AuthLayout>
  );
}
