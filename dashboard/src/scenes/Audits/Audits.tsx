import React, { useState, useEffect } from 'react';

import { Button, Card, DatePicker } from 'antd';
import moment, { Moment } from 'moment';
import { RangeValue } from 'rc-picker/lib/interface';

import AuditsTable from './AuditsTable';
import * as api from '../../api';
import { Audit } from '../../types';

const { RangePicker } = DatePicker;

function Audits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [dates, setDates] = useState<RangeValue<Moment>>();
  const [isReloadDisabled, setReloadDisable] = useState<boolean>(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (queryPath = '') => {
    try {
      setReloadDisable(true);
      const data = await api.audit.find(queryPath);
      if (data) {
        setAudits(data);
      }
    } catch (error) {
      setAudits([]);
    } finally {
      setReloadDisable(false);
    }
  };

  const handleSearch = async () => {
    let queryPath = `?`;
    queryPath += `start=${dates && dates[0] ? dates[0].valueOf() : moment().valueOf()}`;
    queryPath += `&end=${dates && dates[1] ? dates[1].valueOf() : moment().valueOf()}`;
    await fetchData(queryPath);
  };

  const dateFormat = 'YYYY/MM/DD';

  return (
    <Card title="Audits" className="audits-scene text-center">
      <div className="flex flex-jc-sb flex-ai-c" style={{ marginBottom: '1rem' }}>
        <RangePicker
          allowEmpty={[false, false]}
          defaultValue={[moment(), moment()]}
          format={dateFormat}
          onCalendarChange={(val) => setDates(val)}
        />
        <Button type="primary" loading={isReloadDisabled} disabled={isReloadDisabled} onClick={handleSearch}>
          Reload
        </Button>
      </div>
      <AuditsTable loading={isReloadDisabled} audits={audits} />
    </Card>
  );
}

export default Audits;
