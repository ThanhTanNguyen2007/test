import React, { useEffect, useState } from 'react';

import { Button, Card, Modal } from 'antd';

import { ApiKey } from '../../types';
import * as api from '../../api';

function Credentials() {
  const [apiKey, setApiKey] = useState<ApiKey | null>();
  const [show, setShow] = useState(false);

  const getApiKey = async () => {
    const fetchedApiKey = await api.partner.getApiKey();
    if (fetchedApiKey) {
      setApiKey(fetchedApiKey);
    }
  };

  useEffect(() => {
    getApiKey();
  }, []);

  const onClickGenerateApiKey = async () => {
    Modal.confirm({
      title: 'Generate new Api Key',
      content: (
        <>
          <p>Are you sure you want to generate a new Api Key?</p>
          {apiKey && (
            <p>
              Current Api Key is <b>NOT</b> available any longer
            </p>
          )}
        </>
      ),
      onOk: async () => {
        const newApiKey = await api.partner.generateApiKey();
        if (newApiKey) {
          setApiKey(newApiKey);
          setShow(true);
        }
      },
    });
  };

  const handleClose = async () => {
    await getApiKey();
    setShow(false);
  };

  const onDeactivateApiKey = async () => {
    Modal.confirm({
      title: 'Deactivate Api Key',
      content: (
        <>
          <p>Are you sure you want to deactivate this Api Key?</p>
          <p>
            You will <b>NOT</b> be able to enable it again.
          </p>
        </>
      ),
      onOk: async () => {
        const updatedApiKey = await api.partner.deactivateApiKey();
        if (updatedApiKey) {
          setApiKey(updatedApiKey);
        }
      },
    });
  };

  return (
    <Card title="Credentials" className="text-center">
      <Button onClick={onClickGenerateApiKey} type="primary">
        Generate New Api Key
      </Button>
      <Modal
        title="New Api Key"
        visible={show}
        onCancel={handleClose}
        keyboard={false}
        footer={[
          <Button key="close" type="default" onClick={handleClose}>
            Close
          </Button>,
        ]}
      >
        <p>Below is the new ApiKey, please save this credential now.</p>
        <p>
          You will <b>NOT</b> be able to reveal this again!
        </p>
        <p>{apiKey?.value}</p>
      </Modal>
      {apiKey && (
        <div className="text-center" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
          Your Api Key is: {apiKey.value}
          <br />
          Status:{' '}
          <span style={{ color: apiKey.isActive ? 'green' : 'red' }} className="mr-7">
            {apiKey.isActive ? 'Active' : 'Inactive'}
          </span>
          {apiKey.isActive && (
            <Button type="primary" shape="round" size="small" onClick={onDeactivateApiKey}>
              Deactivate
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Credentials;
