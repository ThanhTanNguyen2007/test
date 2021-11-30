import React, { useEffect, useState } from 'react';

import moment, { Moment } from 'moment';
import { RangeValue } from 'rc-picker/lib/interface';
import { Button, Card, DatePicker, Tooltip, Select } from 'antd';
import { StockOutlined } from '@ant-design/icons';
import _ from 'lodash';

import * as api from '../../api';
import { Usage, Account } from '../../types';
import UsageTable from './UsageTable';
import UsageChart from './UsageChart';
import { ExportCSV } from '../../components';

const { RangePicker } = DatePicker;
const { Option } = Select;

type AnalyticsChart = {
  date: string;
  sent: number;
  delivered: number;
}[];

function UsagePage() {
  const [records, setRecords] = useState<Usage[]>([]);
  const [analyticsChart, setAnalyticsChart] = useState<AnalyticsChart>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dates, setDates] = useState<RangeValue<Moment>>([moment(), moment()]);
  const [isInputDisabled, setInputDisable] = useState<boolean>(false);
  const [filtedWabaId, setFiltedWabaId] = useState<string>();
  const [filtedPhoneNumber, setFiltedPhoneNumber] = useState<string>('all');
  const [isChart, setIsChart] = useState(false);
  const [isDisbledChart, setIsDisbledChart] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { accounts } = await api.account.find(true);
      setAccounts(accounts);
    };
    fetchAccounts();
  }, []);

  const fetchUsage = async (queryPath: string) => {
    try {
      setInputDisable(true);
      const { analytics } = await api.usage.getUsage(queryPath);
      setAnalyticsChart(
        analytics[0].dividedMessagesEachDates.map((x) => {
          return {
            ...x,
            date: moment(new Date(x.date)).format('YYYY/MM/DD'),
          };
        }),
      );
      setRecords(analytics);
      // setTotal(total);
    } catch (error) {
      console.error(error.message);
      setRecords([]);
    } finally {
      setInputDisable(false);
    }
  };

  const isDisabledDate = (currentDate: Moment): boolean => {
    if (dates) {
      return currentDate.isAfter(moment()) || currentDate.isBefore(moment().subtract(31 * 3, 'days'));
    }
    return false;
  };

  const handleSearch = async () => {
    const startDate = dates && dates[0] ? dates[0] : moment();
    const endDate = dates && dates[1] ? dates[1] : moment();

    if (endDate.diff(startDate, 'days') >= 1) {
      setIsDisbledChart(false);
      setIsChart(true);
    } else {
      setIsDisbledChart(true);
      setIsChart(false);
    }

    let queryPath = `&start=${startDate.valueOf()}`;
    queryPath += `&end=${endDate.valueOf()}`;
    queryPath += `&wabaIds=${filtedWabaId}`;
    queryPath += filtedPhoneNumber != 'all' ? `&phoneNumbers=${filtedPhoneNumber}` : '';
    fetchUsage(queryPath);
    // setQueryPath(queryPath)
  };

  const handleCalendarChange = (val: RangeValue<moment.Moment>) => {
    // if (anaType === 'MONTH') {
    //   setDates;
    // }
    setDates(val);
  };

  const dateFormat = 'YYYY/MM/DD';
  const optionsWabaId = accounts.map((waba) => (
    <Option value={waba.wabaId} key={waba.wabaId}>
      {`${waba.wabaId}-${waba.name}`}
    </Option>
  ));
  const optionsPhoneNumbers = accounts
    .find((waba) => waba.wabaId == filtedWabaId)
    ?.phoneNumbers?.map((phoneNumber) => (
      <Option value={phoneNumber.value} key={phoneNumber.id}>
        {phoneNumber.value}
      </Option>
    ));

  const getExportData = async () => {
    try {
      const startDate = dates && dates[0] ? dates[0] : moment();
      const endDate = dates && dates[1] ? dates[1] : moment();

      let queryPath = `&start=${startDate.valueOf()}`;
      queryPath += `&end=${endDate.valueOf()}`;

      const { analytics } = await api.usage.getUsage(queryPath);
      console.log('test', analytics);

      const getCsvDividedDatesMessages = async (record: Usage) => {
        return await Promise.all(
          record.dividedMessagesEachDates
            .map((x) => ({
              ...x,
              date: moment(new Date(x.date)).format('YYYY/MM/DD'),
            }))
            .map((anaData) => {
              return {
                [anaData.date]: `${anaData.sent}/${anaData.delivered}`,
              };
            }),
        ).then((arr) => arr.reduce((obj, item) => Object.assign(obj, { ...item }), {}));
      };

      const sanitizedData = await Promise.all(
        analytics.map(async (record) => {
          const csvDividedDatesMessages = await getCsvDividedDatesMessages(record);

          return {
            'WABA Id': record.wabaId,
            'WABA Name': record.wabaName,
            'Owner Email': record.email,
            'Phone Numbers': _.map(record.phoneNumbers, (phoneNumber) => phoneNumber.value).join(' \r\n'),
            'Total Sent Messages': record.sentMessagesCount,
            'Total Delivered Messages': record.deliveredMessagesCount,
            ...csvDividedDatesMessages,
          };
        }),
      );
      return sanitizedData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  return (
    <Card title="Analytics" className="text-center usage">
      <div className="flex flex-jc-sb flex-ai-c" style={{ marginBottom: '1rem' }}>
        <RangePicker
          allowEmpty={[false, false]}
          defaultValue={[moment(), moment()]}
          picker={'date'}
          format={dateFormat}
          value={dates}
          onCalendarChange={handleCalendarChange}
          disabledDate={isDisabledDate}
        />
        <Select
          showSearch
          disabled={isInputDisabled}
          defaultValue="Choose Waba"
          autoFocus
          style={{ width: 300, marginLeft: '20px' }}
          placeholder="Filter with WabaId"
          dropdownStyle={{ maxWidth: '400px' }}
          onSelect={(value) => {
            setFiltedWabaId(value);
            setFiltedPhoneNumber('all');
          }}
          filterOption={(input, option) => option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
        >
          {optionsWabaId}
        </Select>
        {filtedWabaId != 'all' && (
          <Select
            showSearch
            disabled={isInputDisabled || filtedWabaId == 'all'}
            value={filtedWabaId == 'all' ? 'Filter All Phone Numbers' : filtedPhoneNumber}
            defaultValue="Filter All Phone Numbers"
            style={{ width: 180, marginLeft: '20px' }}
            placeholder="Filter with Phone Numbers"
            onSelect={(value) => setFiltedPhoneNumber(value)}
          >
            <Option value="all">Filter all Phone Numbers</Option>
            {optionsPhoneNumbers}
          </Select>
        )}
        <Tooltip placement="top" title={isDisbledChart ? `Pick date range to display` : ''}>
          <Button
            style={{ marginLeft: '20px' }}
            type="primary"
            disabled={isInputDisabled || !filtedWabaId || isDisbledChart}
            onClick={() => setIsChart(!isChart)}
          >
            {isChart ? 'Display Table' : 'Display Chart'}
          </Button>
        </Tooltip>
        <Tooltip placement="top" title={filtedWabaId ? '' : 'Choose waba to analysis'}>
          <Button
            style={{ marginLeft: '20px' }}
            type="primary"
            icon={<StockOutlined />}
            disabled={isInputDisabled || !filtedWabaId}
            onClick={handleSearch}
          >
            Analyse
          </Button>
        </Tooltip>
        <ExportCSV
          style={{ marginLeft: '5px' }}
          getExportData={getExportData}
          fileName="analytics"
          multiSheets={{ fieldSheetName: 'WABA Id' }}
        />
      </div>
      {isChart
        ? records && (
            <UsageChart
              loading={isInputDisabled}
              usageList={analyticsChart}
              totalSent={records[0]?.sentMessagesCount}
              totalDelivered={records[0]?.deliveredMessagesCount}
            />
          )
        : records && <UsageTable loading={isInputDisabled} usageList={records} />}
    </Card>
  );
}

export default UsagePage;
