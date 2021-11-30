import React, { useState } from 'react';

import moment from 'moment';
import { ColumnsType } from 'antd/lib/table';
import { Button, Table } from 'antd';

import { EmbeddedUrlModal } from '.';
import { PartnerToken } from '../../types';
import { formatDatetime } from '../../utils/datetime';

const isBeforeToday = (date: string) => {
  const startOfToday = moment();
  return moment(date).isBefore(startOfToday);
};

type PartnerTokensTableProps = {
  tokens: PartnerToken[];
  revokePartnerToken(partnerKeyId: number): void;
};

const PartnerTokensTable = ({ tokens, revokePartnerToken }: PartnerTokensTableProps) => {
  const [urlModalShow, setUrlModalShow] = useState(false);
  const [selectedPartnerToken, setSelectedPartnerToken] = useState('');

  const columns: ColumnsType<PartnerToken> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: 'Usage',
      dataIndex: 'usage',
      key: 'usage',
      align: 'center',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: function CreatedAt(createdAt) {
        return <>{formatDatetime(createdAt)}</>;
      },
    },
    {
      title: 'Expires At',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: function CreatedAt(expiresAt) {
        return <>{formatDatetime(expiresAt)}</>;
      },
    },
    {
      title: 'Last Used At',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: function CreatedAt(usedAt) {
        return <>{formatDatetime(usedAt)}</>;
      },
    },
    {
      title: 'Revoked',
      dataIndex: 'revokedAt',
      key: 'revokedAt',
      align: 'center',
      render: function Revoked(revokedAt) {
        return <>{revokedAt ? 'Yes' : 'No'}</>;
      },
    },
    {
      title: 'Generate embedded url',
      key: 'embeddedUrl',
      render: function CopyEmbeddedUrl(record) {
        return (
          <>
            {!record.revokedAt && !isBeforeToday(record.expiresAt) && (
              <Button
                onClick={() => {
                  setUrlModalShow(true);
                  setSelectedPartnerToken(record.value);
                }}
              >
                Generate
              </Button>
            )}
          </>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: function RevokePartnerToken(record: PartnerToken & { loading: boolean }) {
        return (
          <>
            {!record.revokedAt && !isBeforeToday(record.expiresAt) && (
              <Button type="primary" shape="round" size="small" onClick={() => revokePartnerToken(record.id)}>
                Revoke
              </Button>
            )}
          </>
        );
      },
    },
  ];
  return (
    <>
      <Table
        columns={columns}
        dataSource={tokens.map((x) => {
          return { ...x, key: x.id };
        })}
        bordered
        rowClassName={(record) => {
          return record.revokedAt || isBeforeToday(record.expiresAt) ? 'disableRow' : '';
        }}
      />
      <EmbeddedUrlModal partnerToken={selectedPartnerToken} show={urlModalShow} handleClose={() => setUrlModalShow(false)} />
    </>
  );
};

export default PartnerTokensTable;
