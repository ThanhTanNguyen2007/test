import React, { useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';

import { Button, notification } from 'antd';

type Props = {
  uniqueValue: string;
  handleReload(): Promise<void>;
};

const ReloadButton = ({ uniqueValue, handleReload }: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHover, setIsHover] = useState(false);

  const reloadData = async () => {
    try {
      setIsLoading(true);
      await handleReload();
    } catch (error) {
      notification.error({
        message: `Reloaded Failed for ${uniqueValue}`,
        description: `${error.response?.status === 429 ? 'You have already reloaded recently, please try again later!':'Got error on reloading waba '+ uniqueValue}`,
        placement: 'topRight',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type={isHover ? 'primary' : 'ghost'}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      ghost={isHover ? true : false}
      icon={<ReloadOutlined />}
      loading={isLoading}
      onClick={reloadData}
    >
      Reload
    </Button>
  );
};

export default ReloadButton;
