import React, { useState, useEffect } from 'react';

import { Button, Checkbox, Form, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';

import * as api from '../../api';
import { UserStatusEnum } from '../../types';
import { WabaPhoneNumber } from '../../api/account';
import { launchWhatsAppSignup } from '../../facebookSdk';

type OnboardingFormProps = {
  isAdmin: boolean | null;
  partnerId: number | null;
  userOnboardingStatus: string | null;
  setConnectResponse: React.Dispatch<React.SetStateAction<string | WabaPhoneNumber[] | null>>
};

const OnboardingForm = ({ isAdmin, partnerId, userOnboardingStatus, setConnectResponse }: OnboardingFormProps) => {
  const { token } = useParams<{ token: string }>();
  const [partnerToken, setPartnerToken] = useState<undefined | string>(token);
  const [partnerTokenConfirmation, setPartnerTokenConfirmation] = useState(false);
  const [agreeTnc, setAgreeTnc] = useState(false);
  const [oauthToken, setOauthToken] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const onClickOnboardingButton = async () => {
    try {
      setLoading(true);
      if (userOnboardingStatus && userOnboardingStatus === UserStatusEnum.NotInitiated) {
        api.user.initiateOnboardingProcess();
      }
      // TODO: change when using real FB login
      const oauthToken = await launchWhatsAppSignup();

      //const oauthToken = await mockLaunchWhatsAppSignup();
      setOauthToken(oauthToken);
    } catch (err) {
      console.log(err);
      if(typeof err === 'string') {
        setConnectResponse(err)
      }
      await api.account.userCanceledFacebookFlow();
      setLoading(false);
    }
  };
  const togglePartnerTokenConfirmed = () => {
    setPartnerTokenConfirmation(!partnerTokenConfirmation);
  };
  useEffect(() => {
    if (oauthToken) {
      const fetchData = async () => {
        try {
          const data = await api.account.connect(oauthToken, partnerToken);
          setConnectResponse(data);
        } catch (err) {
          console.log(err);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [oauthToken]);

  return (
    <Form layout="vertical">
      {!isAdmin && !partnerId && (
        <>
          <Form.Item label="Partner Key:">
            <Input
              type="email"
              placeholder="Enter Key"
              onChange={(e) => setPartnerToken(e.target.value)}
              disabled={partnerTokenConfirmation}
              value={partnerToken}
            />
          </Form.Item>
          <div className="text-muted">
            Unique key received from partner. You do not need a key for individual sign up
          </div>
          <Button
            type="primary"
            disabled={loading}
            style={{ marginTop: '10px' }}
            size="small"
            onClick={togglePartnerTokenConfirmed}
          >
            {partnerTokenConfirmation ? 'Edit' : 'Continue'}
          </Button>
        </>
      )}
      {(partnerTokenConfirmation || isAdmin || partnerId) && (
        <>
          <Form.Item>
            <Checkbox
              disabled={loading}
              checked={agreeTnc}
              onChange={(e) => {
                setAgreeTnc(e.target.checked);
              }}
            >
              I agree to terms and conditions
            </Checkbox>
          </Form.Item>
          <Button
            type="primary"
            disabled={(!partnerTokenConfirmation && !isAdmin && !partnerId) || !agreeTnc || loading}
            onClick={onClickOnboardingButton}
          >
            Connect WhatsApp Business Account / Add number {loading && <LoadingOutlined />}
          </Button>
        </>
      )}
    </Form>
  );
};

export default OnboardingForm;
