import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App.tsx';
import { auth0Config, usingSampleData } from './api';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {usingSampleData ? (
      <App />
    ) : (
      <Auth0Provider
        domain={auth0Config.domain!}
        clientId={auth0Config.clientId!}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Config.audience,
          scope: 'openid profile email',
        }}
        // Keeps students signed in across page reloads. Needs "Refresh Token
        // Rotation" turned on for this application in the Auth0 dashboard.
        useRefreshTokens
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    )}
  </StrictMode>,
);
