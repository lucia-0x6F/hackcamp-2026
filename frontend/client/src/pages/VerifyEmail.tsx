import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';

const NOTES = [{ title: 'almost in!', when: 'Check your inbox', color: 'yellow', back: 'mint' }];

/**
 * Shown after Auth0 sign-up until the user clicks the link in Auth0's
 * verification email. The backend refuses unverified emails, so nothing in
 * the app works before this.
 */
export function VerifyEmail({
  email,
  onCheckAgain,
  onLogOut,
}: {
  email: string;
  onCheckAgain: () => Promise<void>;
  onLogOut: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await onCheckAgain();
      // If we're still on this screen afterwards, Auth0 still says unverified.
      setMessage("Not verified yet. Click the link in the email, then try again.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthLayout
      heading={
        <>
          One more <span className="marker">step.</span>
        </>
      }
      blurb="We use your verified email to keep your account secure."
      notes={NOTES}
      pose="wave"
      onBack={onLogOut}
    >
      <p className="mono-label">Step 2 of 3</p>
      <h1 className="auth-title">Verify your email</h1>
      <p className="check-email">
        We sent a link to <strong>{email}</strong>. Click it, then come back here.
      </p>
      {message && (
        <p className="field-error" role="status">
          {message}
        </p>
      )}
      <div className="verify-actions">
        <button className="cta" onClick={check} disabled={checking}>
          {checking ? 'Checking…' : "I've verified"} <span className="cta-arrow" aria-hidden="true">→</span>
        </button>
      </div>
      <p className="auth-switch">
        Nothing arrived? Check spam, or{' '}
        <button className="link" onClick={onLogOut}>
          log out and try again
        </button>
        .
      </p>
    </AuthLayout>
  );
}
