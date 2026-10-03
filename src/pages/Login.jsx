import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="iv-grid-bg min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative drifting orbs — pure ambience, non-interactive. */}
      <div
        aria-hidden
        className="iv-orb pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--iv-accent-soft) / 0.35), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="iv-orb pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--iv-accent) / 0.22), transparent 70%)', animationDelay: '-4s' }}
      />

      <div className="iv-card iv-glow-border iv-page-in w-full max-w-sm p-8 relative">
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-11 w-11 rounded-xl grid place-items-center text-white shadow-soft"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(var(--iv-accent)), rgb(var(--iv-accent-dark)))' }}
          >
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <h1 className="iv-display text-xl font-extrabold leading-tight">Inventory</h1>
            <p className="text-xs text-ink/55">Stock management portal</p>
          </div>
        </div>

        <p className="text-sm text-ink/60 mb-6">Sign in to manage or view stock.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="iv-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="iv-input"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="iv-badge bg-red-50 text-red-700 w-full justify-start border border-red-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="iv-btn iv-btn-primary mt-2 w-full">
            {loading ? (
              <>
                <span className="iv-spinner h-4 w-4" />
                Signing in…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
