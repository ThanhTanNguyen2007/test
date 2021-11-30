import React, { useEffect, useState } from 'react';
import { Me } from './types';
import './App.css';
import Routes from './Routes';
import { setUpdateLoginState, user } from './api';
import { initFacebookSdk } from './facebookSdk';

initFacebookSdk();

function App(): JSX.Element {
  const [me, setMe] = useState<null | Me>(null);
  setUpdateLoginState((newMe: null | Me) => {
    setMe(newMe);
    localStorage.setItem('email', newMe?.email || "")
  });
  useEffect(() => {
    (async function() {
      await user.me();
    })();
  }, []);
  return <Routes me={me} />;
}

export default App;
