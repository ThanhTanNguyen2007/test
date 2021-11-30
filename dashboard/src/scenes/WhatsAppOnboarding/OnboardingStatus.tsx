import React from 'react';

import { WabaPhoneNumber } from '../../api/account';

const OnboardingStatus = ({ connectResponse }: { connectResponse: WabaPhoneNumber[] | string | null }) => {
  if (!connectResponse) {
    return null;
  }

  if(connectResponse === 'WABA connection error') {
    return (<>Your WABA is created/connected to Keyreply Whatsapp Service<br/>
    But it cannot be connected to KR Portal, you may not see the WABA in the Portal.<br/>
    Please send the WABA Id to admin for support.<br/>
    </>);
  }
  if (connectResponse.length === 0) {
    return (
      <>No account or phone number was added. You might have already connected your account and phone number before.</>
    );
  }

  if( typeof connectResponse === 'string') return<div style={{color: 'red', marginTop: '20px'}}>{connectResponse}</div>;

  const { account, newPhoneNumbers } = connectResponse[0];
  const phoneNumber = newPhoneNumbers[0];
  // TODO: add partner info if partner key was used
  let confirmationText = `You have connected ${phoneNumber.value}(Phone Number) from ${account.wabaId}(WABA Id).`;
  if (account?.manager?.partner?.id) {
    confirmationText += ` ${account.manager.partner.user?.email} is the account manager`;
  }
  return <>{confirmationText}</>;
};

export default OnboardingStatus;
