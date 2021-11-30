import React, { useEffect, useState } from 'react';

import { Button, Input, Switch } from 'antd';
import Countdown from 'antd/lib/statistic/Countdown';
import { LoadingOutlined } from '@ant-design/icons';

import * as api from '../../api';

export default function MigrationPage() {
  const params = new URLSearchParams(location.search);
  const [step, setStep] = useState(0);
  const [wabaId, setWabaId] = useState<string | null>();
  const [phoneId, setPhoneId] = useState<string | null>();
  const [otpType, setOtpType] = useState('SMS');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [otpCounting, setOtpCounting] = useState(true);
  const [countingOffset, setCountingOffset] = useState(30000);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>();

  const cc = params.get('cc');
  const phone = params.get('phone');
  const email = params.get('email');

  useEffect(() => {
    fetchWabaId();
  }, []);

  const fetchWabaId = async () => {
    setIsLoading(true);
    if (!phone || !email || !cc) return;
    const wabaIdOfPhone = await api.migration.getWabaIdByPhone(phone, email);
    setWabaId(wabaIdOfPhone);
    setIsLoading(false);
  };

  useEffect(() => {
    initMigration();
  }, [wabaId]);

  useEffect(() => {
    setStep(3);
  }, [isVerified]);

  const initMigration = async () => {
    setIsLoading(true);
    if (!phone || !email || !cc || !wabaId) return;
    const result = await api.migration.init(cc, phone, wabaId);

    if (!result) {
      setPhoneId(null);
    } else {
      setPhoneId(result.phoneNumberId);
      setIsVerified(result.verified);
    }

    setStep(1);

    setIsLoading(false);
  };
  const requestOTP = async () => {
    setIsLoading(true);
    if (phoneId) {
      const result = await api.migration.requestOTP(phoneId, otpType);
      if (typeof result === 'string') {
        if (result?.startsWith('Please wait')) {
          setErrorMessage(result);
          const errorStrParts = result.split(' ');
          if (errorStrParts.length === 11) {
            const hours = +errorStrParts[2];
            const mins = +errorStrParts[4];
            const seconds = +errorStrParts[6];
            const offset = ((hours * 60 + mins) * 60 + seconds) * 1000;
            setCountingOffset(offset);
          }

          if (errorStrParts.length === 13) {
            const days = +errorStrParts[2];
            const hours = +errorStrParts[4];
            const mins = +errorStrParts[6];
            const seconds = +errorStrParts[8];
            const offset = (((days * 24 + hours) * 60 + mins) * 60 + seconds) * 1000;
            setCountingOffset(offset);
          }
        }
        setIsOTPSent(false);
      } else {
        setCountingOffset(13 * 60 * 60 * 1000);
        setIsOTPSent(result);
      }
    }
    setOtpCounting(true);
    setStep(2);
    setIsLoading(false);
  };
  const verifyCode = async () => {
    setIsLoading(true);
    if (phoneId) {
      const isCodeVerified = await api.migration.verifyCode(otp, phoneId);
      setIsVerified(isCodeVerified);
      setStep(isCodeVerified ? 3 : 1);
    }

    setIsOTPSent(true);
    setIsLoading(false);
  };

  const getDealine = () => {
    return Date.now() + countingOffset;
  };
  const onFinish = () => {
    setOtpCounting(false);
  };
  return (
    <div className="migration__content flex flex-jc-c flex-ai-c flex-dir-c">
      <h2>Phone number migration</h2>
      {step !== 3 && !isVerified && (
        <h3>
          Phone number: +{cc} {phone}
        </h3>
      )}
      {isLoading && <LoadingOutlined />}
      {!isLoading && (
        <div className="migration__body flex flex-jc-c flex-ai-c flex-dir-c">
          {/* First state: New page, show phone number, Verify phone number button */}

          {!wabaId && (
            <h4>
              Couldnt find WABA Id for this phone number
              <br /> Please contact admin for more information
            </h4>
          )}
          {step === 1 && wabaId && !phoneId && (
            <h4>
              Couldnt initiate migration for this phone number
              <br /> Please try again later
            </h4>
          )}
          {step === 1 && wabaId && phoneId && !isOTPSent && (
            <>
              <h4>
                Please note that as per Facebook&#39;s WhatsApp migration policy, an OTP can be triggered only once per
                13 hours
              </h4>
              <div className="flex flex-jc-c flex-ai-c mb-12">
                <div style={{ marginRight: '12px', verticalAlign: 'middle' }}>OTP type: </div>
                <Switch
                  defaultChecked
                  onChange={(checked) => setOtpType(checked ? 'SMS' : 'VOICE')}
                  checkedChildren="SMS"
                  unCheckedChildren="VOICE"
                />
              </div>

              <Button type="primary" onClick={requestOTP}>
                Verify phone number
              </Button>
            </>
          )}
          {step === 1 && wabaId && phoneId && isOTPSent && (
            <>
              <h4>Verify OTP failed</h4>
              {otpCounting && <Countdown title="Resend OTP after" value={getDealine()} onFinish={onFinish} />}
              <div className="flex flex-jc-c flex-ai-c mb-12">
                <div style={{ marginRight: '12px', verticalAlign: 'middle' }}>OTP type: </div>
                <Switch
                  disabled={otpCounting}
                  style={{ marginRight: '12px' }}
                  defaultChecked
                  onChange={(checked) => setOtpType(checked ? 'SMS' : 'VOICE')}
                  checkedChildren="SMS"
                  unCheckedChildren="VOICE"
                />
                <Button type="primary" disabled={otpCounting} onClick={requestOTP}>
                  Resend OTP
                </Button>
              </div>

              <div className="flex flex-jc-c flex-ai-c">
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  style={{ width: 100, marginRight: '20px' }}
                />
                <Button type="primary" onClick={verifyCode}>
                  Submit
                </Button>
              </div>
            </>
          )}
          {/* Second state: Initiated migration, show form to input OTP */}
          {step === 2 && !isOTPSent && (
            <>
              {errorMessage && errorMessage?.startsWith('Please wait') ? (
                <>
                  <h4>An OTP had already been sent.</h4>
                  {otpCounting && <Countdown title="Resend OTP after" value={getDealine()} onFinish={onFinish} />}
                  <div className="flex flex-jc-c flex-ai-c mb-12">
                    <div style={{ marginRight: '12px', verticalAlign: 'middle' }}>OTP type: </div>
                    <Switch
                      disabled={otpCounting}
                      style={{ marginRight: '12px' }}
                      defaultChecked
                      onChange={(checked) => setOtpType(checked ? 'SMS' : 'VOICE')}
                      checkedChildren="SMS"
                      unCheckedChildren="VOICE"
                    />
                    <Button type="primary" disabled={otpCounting} onClick={requestOTP}>
                      Resend OTP
                    </Button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="OTP"
                      style={{ width: 100, marginRight: '20px' }}
                    />
                    <Button type="primary" onClick={verifyCode}>
                      Submit
                    </Button>
                  </div>
                </>
              ) : (
                <h4>
                  Couldnt send OTP to your phone number
                  <br />
                  Please try again later!
                </h4>
              )}
            </>
          )}
          {step === 2 && isOTPSent && (
            <>
              <h4>
                OTP has been sent to your phone number
                <br />
                Please input the OTP to verify
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  style={{ width: 100, marginRight: '20px' }}
                />
                <Button type="primary" onClick={verifyCode}>
                  Submit
                </Button>
              </div>
            </>
          )}
          {/* Third state: Verified phone number */}
          {step === 3 && isVerified && (
            <h3>
              Phone number +{cc} {phone} is migrated!
            </h3>
          )}
        </div>
      )}
    </div>
  );
}
