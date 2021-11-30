import React, { useState, useEffect } from 'react';

import { Modal, Button } from 'antd';

import * as api from '../../api';
import { PhoneNumber } from '../../types';

type Props = {
  show: boolean;
  phoneNumberInfo: PhoneNumber | null;
  handleClose(): void;
};
const PhoneInfoModal = ({ phoneNumberInfo, handleClose, show }: Props) => {
  if (!phoneNumberInfo) {
    return null;
  }
  const [cert, setCert] = useState('');

  useEffect(() => {
    if (!show) {
      setCert('');
      return;
    }
  }, [show]);

  const fetchData = async () => {
    const data = await api.phoneNumber.getPhoneCert(phoneNumberInfo.phoneNumberId);
    if (data?.cert) {
      setCert(data.cert);
    }
  };

  const handleQualityRating = (qualityRating: string): JSX.Element => {
    let result: string = qualityRating;
    let color = 'white';
    qualityRating = qualityRating.toLocaleLowerCase();
    if (qualityRating == 'green') {
      result = 'High';
      color = 'green';
    } else if (qualityRating == 'yellow') {
      result = 'Medium';
      color = 'yellow';
    } else if (qualityRating == 'red') {
      result = 'Low';
      color = 'red';
    }
    return (
      <ul className={color}>
        <li>{result}</li>
      </ul>
    );
  };

  return (
    <Modal
      className="phoneInforModal"
      title="Phone Information"
      visible={show}
      onCancel={handleClose}
      keyboard={false}
      footer={[
        <Button key="close" type="default" onClick={handleClose}>
          Close
        </Button>,
      ]}
    >
      <p>Name: {phoneNumberInfo.verifiedName}</p>
      <p>Phone number: {phoneNumberInfo.value}</p>
      <p>Status: {phoneNumberInfo.status}</p>
      <p>Name status: {phoneNumberInfo.nameStatus}</p>
      {phoneNumberInfo.limit && <p>Limit: {phoneNumberInfo.limit}</p>}
      <div className="flex flex-ai-c ">
        <p>Quality rating:</p>
        {handleQualityRating(phoneNumberInfo.qualityRating)}
        <a className="ml-10 mb-14" target="blank" href="https://www.facebook.com/business/help/896873687365001">Learn more</a>
      </div>
      {cert ? (
        <>
          <p>Below is the base64 encoded certificate</p>
          <p style={{ overflowWrap: 'break-word' }}>{cert}</p>
        </>
      ) : (
        phoneNumberInfo.certAvailableAt && (
          <Button type="primary" shape="round" size="small" onClick={() => fetchData()}>
            Cert
          </Button>
        )
      )}
    </Modal>
  );
};

export default PhoneInfoModal;
