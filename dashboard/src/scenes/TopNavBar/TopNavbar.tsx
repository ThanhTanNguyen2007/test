import React from 'react';

import { Menu, Button, Dropdown } from 'antd';

import { Login } from '../Login';
import { Logout } from '../Logout';

type Props = {
  email: null | string;
};

// TODO: handle email verification notice
function LoginSection({ email }: { email: string | null }) {
  if (email) {
    const menu = (
      <Menu>
        <Menu.Item key="sign-out">
          <Logout>
            <>Sign out</>
          </Logout>
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown placement="bottomRight" overlay={menu}>
        <Button type="text">{`Hello, ${email}`}</Button>
      </Dropdown>
    );
  }
  return (
    <Login isLoggedIn={!!email}>
      <Button>Login / Sign up</Button>
    </Login>
  );
}

export default function TopNavbar({ email }: Props) {
  return (
    <div className="topNavBar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
          <img height="50px" src="/keyreply_logo.png" alt="KeyReply Logo" />{' '}
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>WhatsApp Portal</span>
        </div>
        <div style={{ flexGrow: 1, textAlign: 'right' }}>
          <LoginSection email={email} />
        </div>
      </div>
    </div>
  );
}
