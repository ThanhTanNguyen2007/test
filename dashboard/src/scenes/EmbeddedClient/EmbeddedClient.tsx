import React, { useEffect, useState } from 'react';

import { Button, Checkbox, Form } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import * as api from '../../api';
import { WabaPhoneNumber } from '../../api/account';
import { launchWhatsAppSignup } from '../../facebookSdk';
import { OnboardingStatus } from '../WhatsAppOnboarding';
import { UserStatusEnum } from '../../types';
import { Login } from '../Login';

type Props = {
  email: string | null;
  userOnboardingStatus: string | null;
};

function EmbeddedClient({ email, userOnboardingStatus }: Props) {
  const history = useHistory();
  const [oauthToken, setOauthToken] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const [agreeTnc, setAgreeTnc] = useState(false);
  const [withoutKRAccount, setWithoutKRAccount] = useState(false);
  const [connectResponse, setConnectResponse] = useState<WabaPhoneNumber[] | string | null>(null);
  const params = new URLSearchParams(location.search);
  const partnerToken = params.get('partner') || undefined;
  const customerId = params.get('customerId') || undefined;

  if (customerId && !withoutKRAccount) {
    setWithoutKRAccount(true);
  }
  const isWithMigration = params.get('withMigration') === '1';
  const onClickOnboardingButton = async () => {
    try {
      setLoading(true);
      if (userOnboardingStatus && userOnboardingStatus === UserStatusEnum.NotInitiated) {
        api.user.initiateOnboardingProcess();
      }
      const oauthToken = await launchWhatsAppSignup();

      setOauthToken(oauthToken);
    } catch (err) {
      console.log(err);
      if(typeof err === 'string') {
        setConnectResponse(err)
      }
      if(withoutKRAccount) {
        await api.account.userWithCustomerIdCanceledFacebookFlow('' + partnerToken, '' + customerId)
      } else {
        await api.account.userCanceledFacebookFlow();
      }
      
      setLoading(false);
    }
  };
  const navigateToAccountPage = () => {
    history.push('accounts');
  };
  useEffect(() => {
    if (oauthToken) {
      const doWabaConnect = async () => {
        try {
          const data = await api.account.connect(oauthToken, partnerToken, customerId);
          setConnectResponse(data);
        } catch (err) {
          console.log(err);
        }
        setLoading(false);
      };
      doWabaConnect();
    }
  }, [oauthToken]);

  return (
    <>{isWithMigration && <h2 style={{textAlign: 'center', marginTop: '2rem', marginBottom: '2rem'}}>WABA Migration</h2>}
      <div style={{ display: 'flex', maxWidth: '800px', margin: 'auto', flexDirection: 'row', justifyContent: isWithMigration? 'space-between' : 'center', alignItems: 'flex-start' }}>
        {isWithMigration && <div style={{ maxWidth: '300px', border: '1px solid black', padding: '12px' }}>
          Steps you will need to do:<br />
          1. Login to your existing Facebook business manager account<br />
          2. Complete Step 1 fully, but don’t proceed to Step 2<br />
          3. In Step 1, you will need to:<br />
          a. <strong><u>Select</u></strong> (and not create) your existing “Facebook Business Account” which is linked with the number you are migrating over<br />
          b. <strong><u>Create new</u></strong> (and not select) “WhatsApp Business Account”. This is the new account your number will be migrating to.<br />
          c. Stop after you reach the account confirmation screen which will say “Accounts have been setup”. We will <strong><u>NOT</u></strong> proceed to Step 2.
        </div>}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

          {!isWithMigration && <div
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              maxWidth: '720px',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            {!email && !withoutKRAccount && (
              <>
                <h3>Apply for WhatsApp Business APIs</h3>
                <p>To continue, please follow the steps below:</p>
                <ol style={{ textAlign: 'left' }}>
                  <li>Create an account by clicking the “Register Now” button</li>
                  <li>
                    Once account created, you will be able to create/connect your Facebook Account and <br /> create a
                    “WhatsApp Business API Account”
                  </li>
                </ol>
                <div style={{ backgroundColor: '#fcf5e9', padding: '1rem', fontWeight: 500 }}>
                  Make sure you use the same email address you used for your Facebook Business Account.
                </div>
              </>
            )}
            {!isWithMigration && (email || withoutKRAccount) && (
              <>
                <h3>Apply for WhatsApp Business APIs</h3>
                <p>
                  To continue, you will need to access your company’s Facebook business account.
                  <br />
                  By clicking the “Connect Facebook Business Account” button below you can:{' '}
                </p>
                <ol style={{ textAlign: 'left', listStylePosition: 'inside' }}>
                  <li>Create new or select existing Facebook and WhatsApp business accounts</li>
                  <li>Provide a display name and description for your WhatsApp business profile</li>
                  <li>Connect and verify your phone number to use for WhatsApp API access</li>
                </ol>
                <div style={{ backgroundColor: '#fcf5e9', padding: '1rem', fontWeight: 500 }}>
                  Do <span style={{ fontWeight: 900 }}>not</span> use a number that is currently connected to an existing
                  WhatsApp account.
                  <br />
                  This includes numbers that are connected to the WhatsApp Business App.
                </div>{' '}
              </>
            )}
          </div>}
          <div style={{ textAlign: 'center' }}>
            {!withoutKRAccount && (
              <Login isLoggedIn={!!email} redirectUri={location.href}>
                {!email ? <Button type="primary">Register now</Button> : <></>}
              </Login>
            )}
            {(email || withoutKRAccount) && (
              <div style={{ marginTop: !isWithMigration ? '2rem': '0', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                {connectResponse && (
                  <>
                    <OnboardingStatus connectResponse={connectResponse} />
                    <Button
                      style={{ width: 'fit-content', marginTop: '1rem' }}
                      type="primary"
                      onClick={navigateToAccountPage}
                    >
                      Navigate to Portal
                    </Button>
                  </>
                )}
                {!connectResponse && (
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
                    <Button type="primary" disabled={!agreeTnc || loading} onClick={onClickOnboardingButton}>
                      Connect Facebook Business Account/Add WhatsApp number {loading && <LoadingOutlined />}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EmbeddedClient;
