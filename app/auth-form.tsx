'use client';

import { useActionState, useState } from 'react';
import { categories } from '@/lib/catalog';
import { loginAction, registerAction, requestPasswordResetAction, updatePasswordAction } from './auth-actions';

type Mode = 'register' | 'login' | 'reset' | 'update';
const actions = { register: registerAction, login: loginAction, reset: requestPasswordResetAction, update: updatePasswordAction };

export function AuthForm({ mode, checkEmail = false, verificationFailed = false, signOutFailed = false, defaultRole = 'customer' }: { mode: Mode; checkEmail?: boolean; verificationFailed?: boolean; signOutFailed?: boolean; defaultRole?: 'customer' | 'provider' }) {
  const [state, action, pending] = useActionState(actions[mode], {});
  const [role, setRole] = useState<'customer' | 'provider'>(defaultRole);
  const heading = { register: 'Create your account', login: 'Welcome back', reset: 'Reset your password', update: 'Choose a new password' }[mode];

  return <main className="wrap auth-wrap">
    <a className="logo" href="/"><i/>Doorstep</a>
    <section className="card auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{heading}</h1>
      {checkEmail && <p className="auth-message" role="status">Check your email for a verification link to finish creating your account.</p>}{verificationFailed && <p className="auth-error" role="alert">That verification link could not be used. Request a new one or sign in if your account is already verified.</p>}{signOutFailed && <p className="auth-error" role="alert">We could not finish signing you out. Please try signing in again or retry from your dashboard.</p>}
      {mode === 'register' && <div className="tabs auth-tabs" role="group" aria-label="Account type">
        <button type="button" aria-pressed={role === 'customer'} onClick={() => setRole('customer')}>I need a service</button>
        <button type="button" aria-pressed={role === 'provider'} onClick={() => setRole('provider')}>I offer a service</button>
      </div>}
      <form action={action} className="auth-fields">
        {mode === 'register' && <>
          <input type="hidden" name="role" value={role}/>
          <label>Full name<input name="full_name" autoComplete="name" minLength={2} maxLength={120} required/></label>
          {role === 'provider' && <>
            <label>Business name<input name="business_name" autoComplete="organization" minLength={2} maxLength={120} required/></label>
            <label>Main service<select name="category" defaultValue="Plumbing">{categories.map(([name]) => <option key={name}>{name}</option>)}</select></label>
            <label>County, town, or area<input name="location" autoComplete="address-level2" minLength={2} maxLength={160} required/></label>
          </>}
          <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={32}/></label>
        </>}
        {mode !== 'update' && <label>Email<input name="email" type="email" autoComplete="email" required/></label>}
        {(mode === 'register' || mode === 'login' || mode === 'update') && <label>{mode === 'update' ? 'New password' : 'Password'}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required/></label>}
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="auth-message" role="status">{state.message}</p>}
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Please wait…' : { register: 'Create account', login: 'Sign in', reset: 'Send reset link', update: 'Save new password' }[mode]}</button>
      </form>
      {mode === 'login' && <a className="auth-link" href="/reset-password">Forgot your password?</a>}
      {mode === 'register' && <p className="note">We’ll email you a verification link before you can sign in. Read the <a href="/privacy">pre-launch privacy information</a>; the final notice is still under legal review.</p>}
      <p className="auth-switch">{mode === 'register' ? <>Already registered? <a href="/login">Sign in</a></> : mode === 'login' ? <>New to Doorstep? <a href="/register">Create an account</a></> : mode === 'reset' ? <>Remembered it? <a href="/login">Sign in</a></> : <a href="/login">Return to sign in</a>}</p>
    </section>
  </main>;
}
