import React, { useState, useEffect } from 'react';

import { Card } from 'antd';

import * as api from '../../api';
import { InfoApiUsage } from '../../types';
import { PartnerApiUsageTable } from '.';

function PartnerApiUsage() {
  const [info, setInfo] = useState<InfoApiUsage[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { infoApiUsage } = await api.partner.getPartnerApiUsage();
      setInfo(infoApiUsage);
    };
    fetchData();
  }, []);

  return (
    <Card title="Partner API Usage" className="text-center users">
      <>
        <PartnerApiUsageTable info={info} />
      </>
    </Card>
  );
}

export default PartnerApiUsage;
