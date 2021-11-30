import React, { useState } from 'react';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { Modal, Button, notification } from 'antd';

type Props = {
  uniqueValue: string;
  handleRemove(): void;
};

const RemoveButton = ({ uniqueValue, handleRemove }: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHover, setIsHover] = useState(false);
  const { confirm } = Modal;

  const showConfirm = () => {
    confirm({
      title: 'Are you sure want to remove this item?',
      icon: <ExclamationCircleOutlined />,
      content: `${uniqueValue}`,
      centered: true,
      okText: 'Remove',
      okType: 'danger',
      onOk() {
        removeData();
      },
    });
  };

  const removeData = async () => {
    try {
      setIsLoading(true);
      await handleRemove();
    } catch (error) {
      notification.error({
        message: `Removed Failed ${uniqueValue}`,
        description: `${error}`,
        placement: 'bottomLeft',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type={isHover ? 'primary' : 'dashed'}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      danger={isHover ? true : false}
      icon={<DeleteOutlined />}
      loading={isLoading}
      onClick={showConfirm}
    >
      Remove
    </Button>
  );
};

export default RemoveButton;
