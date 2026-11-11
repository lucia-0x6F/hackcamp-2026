import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { SCHOOL_OPTIONS } from '../format';

const NOTES = [
  { title: 'coffee after class?', when: 'Tomorrow, 2:00 - 3:00 PM', color: 'mint', back: 'yellow' },
  { title: 'spikeball at wreck', when: 'Today, 5:00 - 6:00 PM', color: 'orange', back: 'pink' },
];

/**
 * Step 1 of sign-up: pick a school and enter an email address.
 * We never ask for a password here. Auth0 handles login and email
 * verification. Any valid email address is accepted.
 * Continue hands over to Auth0's sign-up page (prefilled with this email),
 * which sends the verify-your-email message. In sample mode it goes straight
 * to profile setup.
 */
export function SignUp({
  onContinue,
  onLogIn,
  onBack,
}: {
  onContinue: (schoolId: number, email: string) => void;
  onLogIn: () => void;
  onBack: () => void;
}) {
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const school = SCHOOL_OPTIONS.find((s) => s.id === schoolId);
  const error = !school
    ? 'Pick your school first.'
    : !/^[^\s@]+@[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!error && school) onContinue(school.id, email.trim().toLowerCase());
  };

  return (
    <AuthLayout
      heading={
        <>
          Find your people <span className="marker">on campus.</span>
        </>
      }
      blurb="Study sessions, coffee runs, pickup games. Never go alone again."
      notes={NOTES}
      pose="highfive"
      onBack={onBack}
    >
      <p className="mono-label">Step 1 of 3</p>
      <h1 className="auth-title">Sign up</h1>
      <form className="form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Your school</legend>
          <div className="school-picker">
            {SCHOOL_OPTIONS.map((s) => (
              <label key={s.id} className={`school-option bg-${s.color}`}>
                <input
                  type="radio"
                  name="school"
                  value={s.id}
                  checked={schoolId === s.id}
                  onChange={() => setSchoolId(s.id)}
                />
                <span className="school-short">{s.short}</span>
                <span className="school-name">{s.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
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
            aria-describedby="signup-help"
          />
        </label>
        <p id="signup-help" className={touched && error ? 'field-error' : 'field-help'} role={touched && error ? 'alert' : undefined}>
          {touched && error ? error : "Enter the email address associated with your account."}
        </p>
        <button className="cta">
          Continue <span className="cta-arrow" aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{' '}
        <button className="link" onClick={onLogIn}>
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}
