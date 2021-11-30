import React from 'react';

import { auth } from '../../api';

type Props = {
  children: JSX.Element;
};

function Logout({ children }: Props): JSX.Element {
  const onClickLogout = () => {
    auth.logout();
  };

  return (
    <div className="App logout">
      <div onClick={onClickLogout}>{children}</div>
    </div>
  );
}

export default Logout;
