import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@/components/ui';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate(from);
      }
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate(from);
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to homepage
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">CaféQR</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login'
              ? 'Manage your cafés, feedback, and QR codes.'
              : 'Start building branded café engagement pages.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <Input
                label="Display name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-slate-900 underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-slate-900 underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {mode === 'signup' && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              After signing up, ask the platform administrator to assign you to a café.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
