import React, { useState } from 'react';

import { Card } from 'antd';

import { WabaPhoneNumber } from '../../api/account';
import OnboardingForm from './OnboardingForm';
import OnboardingStatus from './OnboardingStatus';

type UserProps = {
  isAdmin: boolean | null;
  partnerId: number | null;
  userOnboardingStatus: string | null;
};

const WhatsAppOnboarding = ({ isAdmin, partnerId, userOnboardingStatus }: UserProps) => {
  const [connectResponse, setConnectResponse] = useState<WabaPhoneNumber[] | string | null>(null);

  return (
    <Card title="WhatsAppOnboarding" className="text-center">
      Add your Whatsapp Business Account via Whatsapp Embedded Sign Up
      <br />
      {!connectResponse && (
        <OnboardingForm
          isAdmin={isAdmin}
          partnerId={partnerId}
          setConnectResponse={setConnectResponse}
          userOnboardingStatus={userOnboardingStatus}
        />
      )}
      {connectResponse && <OnboardingStatus connectResponse={connectResponse} />}
    </Card>
  );
};
export default WhatsAppOnboarding;
