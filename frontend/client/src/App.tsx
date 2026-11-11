import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api, auth0Config, setTokenGetter, usingSampleData, type Profile as ProfileData } from './api';
import { NavBar, type Page } from './components/NavBar';
import { SCHOOL_OPTIONS } from './format';
import { CreateActivity } from './pages/CreateActivity';
import { Discover } from './pages/Discover';
import { LogIn } from './pages/LogIn';
import { MyActivities } from './pages/MyActivities';
import { Profile } from './pages/Profile';
import { SignUp } from './pages/SignUp';
import { Welcome } from './pages/Welcome';
import { VerifyEmail } from './pages/VerifyEmail';
import './App.css';

const emptyProfile: ProfileData = { schoolId: 1, name: '', pronoun: null, schoolYear: 'first', major: null, hobbies: [], interestedTypes: [] };

const schoolForEmail = (email?: string) =>
  SCHOOL_OPTIONS.find((s) => email?.toLowerCase().endsWith(`@${s.domain}`))?.id ?? 1;

type PublicScreen = 'welcome' | 'signup' | 'login';

const scrollTop = () => window.scrollTo(0, 0);

/** Welcome, Sign up and Log in: what you see before you're signed in. */
function PublicScreens({
  onSignUp,
  onLogIn,
}: {
  onSignUp: (schoolId: number, email: string) => void;
  onLogIn: (email: string) => void;
}) {
  const [screen, setScreen] = useState<PublicScreen>('welcome');
  const go = (next: PublicScreen) => {
    setScreen(next);
    scrollTop();
  };

  if (screen === 'signup') return <SignUp onBack={() => go('welcome')} onLogIn={() => go('login')} onContinue={onSignUp} />;
  if (screen === 'login') return <LogIn onBack={() => go('welcome')} onSignUp={() => go('signup')} onContinue={onLogIn} />;
  return <Welcome onSignUp={() => go('signup')} onLogIn={() => go('login')} />;
}

/** The signed-in app: nav plus the four pages. */
function MainApp({
  userId,
  defaultSchoolId,
  onLogOut,
  getAccessTokenSilently,
}: {
  userId: string;
  defaultSchoolId: number;
  onLogOut: () => void;
  getAccessTokenSilently?: () => Promise<string | undefined>;
}) {
  const [page, setPage] = useState<Page>('discover');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    setTokenGetter(getAccessTokenSilently ? () => getAccessTokenSilently() : null);
    return () => setTokenGetter(null);
  }, [getAccessTokenSilently]);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setProfileError(null);
        // First visit after sign-up: step 2 is filling in the profile.
        if (!p) setPage('profile');
      })
      .catch((error: Error) => {
        setProfile(null);
        setProfileError(error.message);
      })
      .finally(() => setProfileLoaded(true));
  }, []);

  const navigate = (next: Page) => {
    setPage(next);
    scrollTop();
  };

  const refreshActivityData = () => setDataRevision((revision) => revision + 1);

  const saveProfile = (saved: ProfileData) => {
    setProfile(saved);
    refreshActivityData();
  };

  return (
    <div className="shell">
      {usingSampleData && <p className="sample-banner">Sample data: nothing is saved to the server.</p>}
      <NavBar current={page} onNavigate={navigate} onLogOut={onLogOut} />
      <main>
        {!profileLoaded ? (
          <p className="status page">Loading profile…</p>
        ) : profileError ? (
          <section className="page">
            <p className="status status-error" role="alert">
              Couldn't load your profile: {profileError}
            </p>
            <button className="cta" onClick={() => window.location.reload()}>
              Try again
            </button>
          </section>
        ) : (
          <>
            {page === 'discover' && <Discover schoolId={profile?.schoolId ?? null} refreshKey={dataRevision} />}
            {page === 'create' && <CreateActivity onCreated={refreshActivityData} onViewDiscover={() => navigate('discover')} />}
            {page === 'mine' && <MyActivities userId={userId} refreshKey={dataRevision} onDiscover={() => navigate('discover')} />}
            {page === 'profile' && (
            <Profile
              initial={profile ?? { ...emptyProfile, schoolId: defaultSchoolId }}
              onSaved={saveProfile}
            />
            )}
          </>
        )}
      </main>
    </div>
  );
}

/** No Auth0 configured: click straight through with fake data. */
function SampleApp() {
  const [signedIn, setSignedIn] = useState<{ schoolId: number } | null>(null);
  if (!signedIn)
    return (
      <PublicScreens
        onSignUp={(schoolId) => setSignedIn({ schoolId })}
        onLogIn={(email) => setSignedIn({ schoolId: schoolForEmail(email) })}
      />
    );
  return <MainApp userId="me" defaultSchoolId={signedIn.schoolId} onLogOut={() => setSignedIn(null)} />;
}

/**
 * Real sign-in through Auth0. Auth0 hosts the sign-up/login pages and sends
 * the Auth0 sign-up page; the backend accepts any account email.
 */
function LiveApp() {
  const { isLoading, isAuthenticated, user, error, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const logOut = () => logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) return <p className="status page">Loading…</p>;

  if (error) {
    const accountAlreadyExists = /already exists|user exists|email.*(exists|registered)/i.test(error.message);
    return (
      <div className="page">
        <p className="status status-error" role="alert">
          {accountAlreadyExists
            ? 'This email is already registered. Please use Log in instead.'
            : `Sign-in problem: ${error.message}`}
        </p>
        <button className="cta" onClick={logOut}>
          Back to start
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !user)
    return (
      <PublicScreens
        onSignUp={(_schoolId, email) =>
          loginWithRedirect({
            authorizationParams: { screen_hint: 'signup', login_hint: email, scope: 'openid profile email' },
          })
        }
        onLogIn={(email) => loginWithRedirect({ authorizationParams: { login_hint: email, scope: 'openid profile email' } })}
      />
    );

  if (user.email_verified !== true) {
    return (
      <VerifyEmail
        email={user.email ?? ''}
        onCheckAgain={async () => {
          // Force Auth0 to refresh its session so the updated email_verified
          // claim is available after the user clicks the verification link.
          await loginWithRedirect({ authorizationParams: { prompt: 'login' } });
        }}
        onLogOut={logOut}
      />
    );
  }

  return (
    <MainApp
      userId={user.sub ?? ''}
      defaultSchoolId={schoolForEmail(user.email)}
      onLogOut={logOut}
      getAccessTokenSilently={() =>
        getAccessTokenSilently({
          // The API needs the verified email from the token or /userinfo.
          authorizationParams: { audience: auth0Config.audience, scope: 'openid profile email' },
        })
      }
    />
  );
}

export default function App() {
  return usingSampleData ? <SampleApp /> : <LiveApp />;
}
