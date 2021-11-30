import React from 'react';
import auth0 from 'auth0-js';

type EmailVerificationNoticeProps = {
  email: null | string;
  needsEmailVerification: null | boolean;
  webAuth: auth0.WebAuth;
};
function EmailVerificationNotice({ email, needsEmailVerification, webAuth }: EmailVerificationNoticeProps) {
  if (!email) {
    return null;
  }
  if (needsEmailVerification) {
    return <div>{email}, please visit your email to complete email verification</div>;
  }
  return (
    <div className="emailVerificationNotice-scene">
      Welcome, {email}!
      {location.pathname.includes('wa-client') ? (
        <>
          {' '}
          <a
            // style={{ cursor: 'pointer', color: '#007bff', fontWeight: 500 }}
            className="login__link"
            onClick={() => webAuth.authorize({ prompt: 'login' })}
          >
            Not you?
          </a>
        </>
      ) : (
        ''
      )}
    </div>
  );
}

export default EmailVerificationNotice;
