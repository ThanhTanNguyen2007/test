import React, { useEffect, useState } from 'react';

import H from 'history';
import auth0, { AuthOptions } from 'auth0-js';
import { useHistory } from 'react-router-dom';

import config from '../../config';
import { auth, user } from '../../api';
import EmailVerificationNotice from './EmailVerificationNotice';

type Props = {
  isLoggedIn: boolean;
  children: JSX.Element;
  redirectUri?: string;
};

async function handleLogin(
  code: string,
  state: string,
  setEmail: React.Dispatch<null | string>,
  setNeedsEmailVerification: React.Dispatch<null | boolean>,
  history: H.History,
) {
  const res = await auth.login(code, state);
  if (!res) {
    return;
  }
  if (res.requiresEmailVerification) {
    setNeedsEmailVerification(res.requiresEmailVerification);
  }
  if (res.email) {
    setEmail(res.email);
  }
  // Clear search params
  const indexOfSearchParams = location.href.indexOf('&code');
  const clearedUrl = indexOfSearchParams !== -1 ? location.href.substring(0, indexOfSearchParams) : location.href;
  window.history.replaceState({}, '', clearedUrl);
  const { partnerId, isAdmin } = await user.me();
  if (location.pathname.includes('wa-client')) {
    return;
  }

  if (partnerId || isAdmin) {
    history.push('accounts');
  }
}

function Login({ isLoggedIn, children, redirectUri }: Props): JSX.Element {
  const history = useHistory();
  const [email, setEmail] = useState<null | string>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState<null | boolean>(null);
  const params = new URLSearchParams(location.search);
  const authConfig: AuthOptions = config.AUTH0_WEBAUTH_CONFIG;
  if (redirectUri) {
    authConfig.redirectUri = redirectUri;
    authConfig.universalLoginPage = false;
  }
  const webAuth = new auth0.WebAuth(authConfig);
  useEffect(() => {
    if (!isLoggedIn) {
      const code = params.get('code');
      const state = params.get('state');
      if (code && state) {
        handleLogin(code, state, setEmail, setNeedsEmailVerification, history);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const loggedEmail = localStorage.getItem('email');
      if (!!loggedEmail) {
        setEmail(loggedEmail);
      }
    }
  }, [isLoggedIn]);

  return (
    <div className="App login-scene">
      <EmailVerificationNotice email={email} webAuth={webAuth} needsEmailVerification={needsEmailVerification} />
      <div onClick={() => webAuth.authorize({ prompt: 'login' })}>{children}</div>
    </div>
  );
}

export default Login;
