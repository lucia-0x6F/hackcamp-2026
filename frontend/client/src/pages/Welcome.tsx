import { Logo } from '../components/Logo';
import { Stickman } from '../components/Stickman';

// Example activities that frame the hero from the edges of the screen.
const NOTES = [
  { title: 'big way anyone?', when: 'Today, 12:00 - 1:00 AM', color: 'pink', back: 'mint' },
  { title: 'nwHacks workshop pull up!', when: 'Nov 23, 4:00 - 6:00', color: 'yellow', back: 'cream' },
  { title: 'ikb study for finals', when: 'Dec 01, 2:00 - 10:00 PM', color: 'olive', back: 'orange' },
  { title: 'coffee after class?', when: 'Tomorrow, 2:00 - 3:00 PM', color: 'mint', back: 'yellow' },
  { title: 'spikeball at wreck', when: 'Today, 5:00 - 6:00 PM', color: 'orange', back: 'pink' },
  { title: 'startup night, need a +1', when: 'Nov 12, 6:00 - 8:00 PM', color: 'pink', back: 'olive' },
] as const;

/**
 * Landing page. Auth0 login isn't wired into the frontend yet, so the two
 * buttons just move into the app: sign up → profile setup, log in → Discover.
 */
export function Welcome({ onSignUp, onLogIn }: { onSignUp: () => void; onLogIn: () => void }) {
  return (
    <main className="welcome">
      <div className="notes" aria-hidden="true">
        {NOTES.map((note, i) => (
          <div key={note.title} className={`note-wrap note-${i + 1}`}>
            <div className={`note note-back bg-${note.back}`} />
            <div className={`note bg-${note.color}`}>
              <p className="note-title">{note.title}</p>
              <p className="note-when">{note.when}</p>
            </div>
          </div>
        ))}
        <Stickman pose="wave" className="stick-1" />
        <Stickman pose="point" className="stick-2" />
        <Stickman pose="walk" className="stick-3" />
        <Stickman pose="highfive" className="stick-4" />
      </div>

      <div className="hero">
        <Logo size={128} className="hero-logo" />
        <h1 className="welcome-brand">on campus</h1>
        <p className="welcome-tagline">
          Don't miss out just because you <strong>don't have someone to go with.</strong>
        </p>
        <button className="cta" onClick={onSignUp}>
          Sign up with email <span className="cta-arrow" aria-hidden="true">→</span>
        </button>
        <p className="cta-hint">UBC · SFU · UVic</p>
        <p className="welcome-login">
          Already have an account?{' '}
          <button className="link" onClick={onLogIn}>
            Log in
          </button>
        </p>
      </div>
    </main>
  );
}
