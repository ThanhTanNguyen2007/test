import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal } from 'antd';
import * as api from '../../api';
import { detect } from 'detect-browser';
import { CopyOutlined } from '@ant-design/icons';
import compareVersions from 'compare-versions';

type EmbeddedUrlModalProps = {
  show: boolean;
  partnerToken: string;
  handleClose: () => void;
};

const EmbeddedUrlModal = ({ show, partnerToken, handleClose }: EmbeddedUrlModalProps) => {
  const [embeddedUrl, setEmbeddedUrl] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [withMigration, setWithMigration] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const baseEmbeddedUrl = `${location.protocol}//${location.host}/wa-client?partner=`;
    if (partnerToken) {
      let url = `${baseEmbeddedUrl}${partnerToken}`;

      if (customerId) {
        url += `&customerId=${customerId}`;
      }

      if (withMigration) {
        url += `&withMigration=1`;
      }

      setEmbeddedUrl(url);
    }
  }, [partnerToken, withMigration, customerId]);

  useEffect(() => {
    if (!customerEmail || !validateEmail(customerEmail)) {
      setCustomerId('');
    }
  }, [customerEmail])
  const validateEmail = (email: string) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const updateCustomerId = async () => {
    if (customerEmail) {
      if (!validateEmail(customerEmail)) {
        setError('Email is not valid');
        return;
      }

      try {
        // call API to create user then return the customerId
        const customerId = await api.user.getCustomerId(customerEmail);
        if (customerId) {
          setCustomerId(customerId);
        }
      } catch (error) {
        error.response && alert(error.response?.data)
      }
      return;
    }
  }

  const copyToClipboard = async () => {
    const browser = detect();
      // navigator.clipboard.writeText not support for safari version below 13.1
      // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard
      if (browser?.name === 'safari' && compareVersions(browser.version, '13.1') === -1) {
        document.addEventListener('copy', function (e) {
          e?.clipboardData?.setData('text/plain', embeddedUrl);
          e.preventDefault();
        });
        document.execCommand('copy');
      } else {
        navigator.clipboard.writeText(embeddedUrl)
        .then(() => {
          alert('Embedded Url is copied to clipboard!');
        })
        .catch((error) => {
          alert('Failed to copy url to clipboard!' + error);
        });
      }
  }
  return (
    <Modal
      title="Generate embedded url"
      footer={<Button onClick={handleClose}>Close</Button>}
      visible={show}
      keyboard={false}
      cancelText="Close"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <strong style={{ padding: '12px', maxWidth: '368px', fontSize: '12px', marginRight: '20px', borderRadius: '5px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>{embeddedUrl}</strong>
        <Button type="default" icon={<CopyOutlined />} onClick={copyToClipboard}>
        </Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Input placeholder="Customer email" type="email" onChange={(e) => setCustomerEmail(e.target.value)} style={{ marginRight: '20px' }} />
        <Button type='primary' onClick={updateCustomerId} disabled={!customerEmail || !validateEmail(customerEmail)}>Confirm</Button>
      </div>
      {error && <span style={{ color: 'red' }}>{error}</span>}
      <Checkbox onChange={(e) => setWithMigration(e.target.checked)}>With Migration</Checkbox>
    </Modal>
  );
};

export default EmbeddedUrlModal;
