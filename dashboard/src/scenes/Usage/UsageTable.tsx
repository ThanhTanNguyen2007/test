import React from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { PhoneNumber, Usage } from '../../types';

type UsageTableProps = {
  usageList: Usage[];
  loading: boolean;
};

const UsageTable = ({ usageList, loading }: UsageTableProps) => {
  const columns: ColumnsType<Usage> = [
    {
      title: 'WABA ID',
      dataIndex: 'wabaId',
      key: 'wabaId',
    },
    {
      title: 'WABA Name',
      align: 'center',
      dataIndex: 'wabaName',
      key: 'wabaName',
    },
    {
      title: 'Owner Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone Numbers',
      dataIndex: 'phoneNumbers',
      key: 'phoneNumbers',
      render: function PhoneNumber(phoneNumbers: PhoneNumber[]) {
        return phoneNumbers.map((num) => {
          return (
            <div key={num.id}>
              <span>{num.value}</span>
            </div>
          );
        });
      },
    },
    {
      title: 'Sent messages',
      align: 'center',
      dataIndex: 'sentMessagesCount',
      key: 'sentMessagesCount',
    },
    {
      title: 'Delivered messages',
      align: 'center',
      dataIndex: 'deliveredMessagesCount',
      key: 'deliveredMessagesCount',
    },
  ];
  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={usageList.map((x) => {
        return {
          ...x,
          key: x.wabaId,
        };
      })}
      bordered
      pagination={false}
    />
  );
};

export default UsageTable;
