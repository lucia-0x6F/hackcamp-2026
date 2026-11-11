import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';

const NOTES = [
  { title: 'ikb study for finals', when: 'Dec 01, 2:00 - 10:00 PM', color: 'olive', back: 'orange' },
  { title: 'big way anyone?', when: 'Today, 12:00 - 1:00 AM', color: 'pink', back: 'mint' },
];

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * Log in with an email address. Continue hands over to Auth0's login page
 * (no passwords are handled by this app). In sample mode it goes straight
 * to Discover.
 */
export function LogIn({ onContinue, onSignUp, onBack }: { onContinue: (email: string) => void; onSignUp: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const error = validEmail(email) ? null : 'Enter a valid email address.';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!error) onContinue(email.trim().toLowerCase());
  };

  return (
    <AuthLayout
      heading={
        <>
          Welcome <span className="marker">back.</span>
        </>
      }
      blurb="See what's happening on campus today."
      notes={NOTES}
      pose="wave"
      onBack={onBack}
    >
      <h1 className="auth-title">Log in</h1>
      <form className="form" onSubmit={submit} noValidate>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@example.com"
            aria-invalid={touched && !!error}
            aria-describedby="login-help"
          />
        </label>
        <p id="login-help" className={touched && error ? 'field-error' : 'field-help'} role={touched && error ? 'alert' : undefined}>
          {touched && error ? error : 'Use the email address associated with your account.'}
        </p>
        <button className="cta">
          Continue <span className="cta-arrow" aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        New here?{' '}
        <button className="link" onClick={onSignUp}>
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}
