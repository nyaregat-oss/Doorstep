'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { categories } from '@/lib/catalog';
import { KENYAN_LOCATIONS } from '@/lib/kenya';
import { loginAction, registerAction, requestPasswordResetAction, updatePasswordAction } from './auth-actions';

type Mode = 'register' | 'login' | 'reset' | 'update';
const actions = {
  register: registerAction,
  login: loginAction,
  reset: requestPasswordResetAction,
  update: updatePasswordAction,
};

export function AuthForm({
  mode,
  checkEmail = false,
  verificationFailed = false,
  signOutFailed = false,
  defaultRole = 'customer',
}: {
  mode: Mode;
  checkEmail?: boolean;
  verificationFailed?: boolean;
  signOutFailed?: boolean;
  defaultRole?: 'customer' | 'provider';
}) {
  const [state, action, pending] = useActionState(actions[mode], {});
  const [role, setRole] = useState<'customer' | 'provider'>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);

  const heading = {
    register: 'Create your account',
    login: 'Welcome back',
    reset: 'Reset your password',
    update: 'Choose a new password',
  }[mode];

  const subtitle = {
    register: 'Join Kenya’s local services marketplace as a customer or skilled professional.',
    login: 'Sign in to manage service requests, quotes, and messages.',
    reset: 'Enter your email address to receive password recovery instructions.',
    update: 'Choose a strong password of at least 8 characters for your account.',
  }[mode];

  return (
    <main className="ds-container ds-auth-page">
      <div className="ds-auth-grid">
        <aside className="ds-auth-showcase" aria-label="Doorstep Kenya overview">
          <div style={{ display: 'grid', gap: 14 }}>
            <span className="ds-eyebrow" style={{ color: 'var(--amber)' }}>
              <ShieldCheck size={14} aria-hidden="true" />
              Doorstep Marketplace Kenya
            </span>
            <h2>Find trusted professionals. Get things done.</h2>
            <p>
              Whether you need a plumber in Kilimani, an electrician in Nyali, or want to showcase your trade to new
              clients, Doorstep keeps bookings, quotes, and conversations organised.
            </p>
          </div>
          <div className="ds-auth-showcase-img">
            <Image
              src="/images/provider-cta.jpg"
              alt="Skilled Kenyan carpenter in his sunlit workshop"
              fill
              sizes="(max-width: 860px) 0vw, 440px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </aside>

        <section className="ds-card-elevated ds-auth-card" aria-labelledby="auth-title">
          <div>
            <h1 id="auth-title" style={{ fontSize: 'clamp(1.85rem, 3.6vw, 2.4rem)' }}>
              {heading}
            </h1>
            <p className="ds-muted" style={{ marginTop: 8 }}>
              {subtitle}
            </p>
          </div>

          {checkEmail && (
            <p className="ds-alert ds-alert-success" role="status">
              Check your email for a verification link to finish creating your account.
            </p>
          )}
          {verificationFailed && (
            <p className="ds-alert ds-alert-error" role="alert">
              That verification link could not be used. Request a new one or sign in if your account is already
              verified.
            </p>
          )}
          {signOutFailed && (
            <p className="ds-alert ds-alert-error" role="alert">
              We could not finish signing you out. Please try signing in again or retry from your dashboard.
            </p>
          )}

          {mode === 'register' && (
            <div className="ds-tabs" role="group" aria-label="Account type" style={{ width: '100%' }}>
              <button
                type="button"
                className="ds-tab-btn"
                style={{ flex: 1 }}
                aria-pressed={role === 'customer'}
                onClick={() => setRole('customer')}
              >
                I need a service
              </button>
              <button
                type="button"
                className="ds-tab-btn"
                style={{ flex: 1 }}
                aria-pressed={role === 'provider'}
                onClick={() => setRole('provider')}
              >
                I offer a service
              </button>
            </div>
          )}

          <form action={action} style={{ display: 'grid', gap: 14 }}>
            {mode === 'register' && (
              <>
                <input type="hidden" name="role" value={role} />
                <label className="ds-field">
                  Full name
                  <input className="ds-input" name="full_name" autoComplete="name" minLength={2} maxLength={120} required />
                </label>

                {role === 'provider' && (
                  <>
                    <label className="ds-field">
                      Business name
                      <input
                        className="ds-input"
                        name="business_name"
                        autoComplete="organization"
                        minLength={2}
                        maxLength={120}
                        required
                      />
                    </label>
                    <label className="ds-field">
                      Main service
                      <select className="ds-select" name="category" defaultValue="Plumbing">
                        {categories.map(([name]) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="ds-field">
                      County, town, or area
                      <input
                        className="ds-input"
                        name="location"
                        list="ds-auth-areas"
                        autoComplete="address-level2"
                        minLength={2}
                        maxLength={160}
                        placeholder="e.g. Westlands, Nairobi"
                        required
                      />
                      <datalist id="ds-auth-areas">
                        {KENYAN_LOCATIONS.map((area) => (
                          <option key={area} value={area} />
                        ))}
                      </datalist>
                    </label>
                  </>
                )}

                <label className="ds-field">
                  Phone (optional)
                  <input
                    className="ds-input"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={32}
                    placeholder="+254 700 000 000"
                  />
                </label>
              </>
            )}

            {mode !== 'update' && (
              <label className="ds-field">
                Email
                <input className="ds-input" name="email" type="email" autoComplete="email" required />
              </label>
            )}

            {(mode === 'register' || mode === 'login' || mode === 'update') && (
              <div className="ds-field">
                <label htmlFor="auth-password-input">{mode === 'update' ? 'New password' : 'Password'}</label>
                <div className="ds-password-wrap">
                  <input
                    id="auth-password-input"
                    className="ds-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    className="ds-password-toggle"
                    aria-label={showPassword ? 'Hide characters' : 'Reveal characters'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            )}

            {state.error && (
              <p className="ds-alert ds-alert-error" role="alert">
                {state.error}
              </p>
            )}
            {state.message && (
              <p className="ds-alert ds-alert-success" role="status">
                {state.message}
              </p>
            )}

            <button className="ds-btn ds-btn-primary ds-btn-full" type="submit" disabled={pending}>
              {pending
                ? 'Please wait…'
                : {
                    register: 'Create account',
                    login: 'Sign in',
                    reset: 'Send reset link',
                    update: 'Save new password',
                  }[mode]}
            </button>
          </form>

          {mode === 'login' && (
            <Link className="ds-muted" href="/reset-password" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Forgot your password?
            </Link>
          )}

          {mode === 'register' && (
            <p className="ds-muted" style={{ fontSize: '0.84rem' }}>
              We’ll email you a verification link before you can sign in. Read our{' '}
              <Link href="/privacy" style={{ textDecoration: 'underline' }}>
                pre-launch privacy information
              </Link>
              .
            </p>
          )}

          <p className="ds-muted" style={{ fontSize: '0.92rem' }}>
            {mode === 'register' ? (
              <>
                Already registered?{' '}
                <Link href="/login" style={{ fontWeight: 700 }}>
                  Sign in
                </Link>
              </>
            ) : mode === 'login' ? (
              <>
                New to Doorstep?{' '}
                <Link href="/register" style={{ fontWeight: 700 }}>
                  Create an account
                </Link>
              </>
            ) : mode === 'reset' ? (
              <>
                Remembered it?{' '}
                <Link href="/login" style={{ fontWeight: 700 }}>
                  Sign in
                </Link>
              </>
            ) : (
              <Link href="/login" style={{ fontWeight: 700 }}>
                Return to sign in
              </Link>
            )}
          </p>
        </section>
      </div>
    </main>
  );
}
