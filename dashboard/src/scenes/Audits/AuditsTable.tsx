import React from 'react';

import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { Audit } from '../../types';
import { formatDatetime } from '../../utils/datetime';

const AuditsTable = ({ audits, loading }: { audits: Audit[]; loading: boolean }) => {
  const columns: ColumnsType<Audit> = [
    {
      title: 'Timestamp',
      key: 'timestamp',
      dataIndex: 'timestamp',
      align: 'center',
      render: function Timestamp(timestamp) {
        return <>{formatDatetime(timestamp)}</>;
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Payload',
      dataIndex: 'payload',
      align: 'center',
      key: 'payload',
    },
  ];

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={audits.map((x) => {
        return {
          ...x,
          key: x.id,
        };
      })}
      bordered
    />
  );
};

export default AuditsTable;
