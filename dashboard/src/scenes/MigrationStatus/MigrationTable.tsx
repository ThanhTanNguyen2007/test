import React from 'react';

import { format } from 'date-fns';
import Table, { ColumnsType } from 'antd/lib/table';
import { Button, message } from 'antd';

import { WABAMigration } from '../../types';

const MigrationTable = ({
  migrations,
  loading,
  isAdmin,
  email,
}: {
  migrations: WABAMigration[];
  loading: boolean;
  isAdmin: boolean | null;
  email: string | null;
}) => {
  const columns: ColumnsType<WABAMigration> = [
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: function CreatedAt(createdAt) {
        return <>{format(new Date(createdAt), 'd MMM yyyy')}</>;
      },
    },
    {
      title: 'Owner Email',
      dataIndex: 'ownerEmail',
      key: 'ownerEmail',
      align: 'center',
    },
    ...(isAdmin
      ? [
          {
            title: 'Partner',
            dataIndex: 'partnerEmail',
            key: 'partnerEmail',
          },
          {
            title: 'WABA Id',
            dataIndex: 'newWABAId',
            key: 'newWABAId',
          },
          {
            title: 'WABA Name',
            dataIndex: 'newWABAName',
            key: 'newWABAName',
          },
        ]
      : []),
    {
      title: 'Phone Numbers',
      dataIndex: 'phoneNumbers',
      key: 'phoneNumbers',
      render: function PhoneNumber(phoneNumbers: string[]) {
        return (
          <div className="flex flex-dir-c flex-jc-sb flex-ai-c">
            {phoneNumbers.map((phoneNumber) => {
              const trimmedNumber = phoneNumber.trim();
              if (isAdmin) return <span>{trimmedNumber}</span>;
              const phoneParts = trimmedNumber.split(' ');
              const countryCode = phoneParts[0].replace('+', '');
              const phone = phoneParts[1].replace(/\D/g, '');
              return (
                <div className="flex flex-jc-sp flex-ai-c" key={phoneNumbers.indexOf(phoneNumber)}>
                  <span className="mr-10">{trimmedNumber}</span>
                  <Button
                    className="ant-btn-small"
                    type="primary"
                    size="small"
                    shape="round"
                    onClick={async () => {
                      const url = `${location.protocol}//${location.host}/migrate?email=${email}&phone=${phone}&cc=${countryCode}`;
                      await navigator.clipboard.writeText(url);
                      message.info('URL copied to clipboard');
                    }}
                  >
                    Get migrate url
                  </Button>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: 'Business Status',
      dataIndex: 'businessVerificationStatus',
      key: 'businessVerificationStatus',
    },
    {
      title: 'WABA Status',
      dataIndex: 'WABAReviewStatus',
      key: 'WABAReviewStatus',
    },
    {
      title: 'KR WABA created',
      dataIndex: 'krWABACreated',
      key: 'krWABACreated',
      render: function KrWABACreated(krWABACreated: boolean) {
        return <>{krWABACreated ? 'Yes' : 'No'}</>;
      },
    },
    {
      title: 'Client Confirmed',
      dataIndex: 'clientConfirm',
      key: 'clientConfirm',
      render: function ClientConfirm(clientConfirm: boolean) {
        return <>{clientConfirm ? 'Yes' : 'No'}</>;
      },
    },
    {
      title: 'Ready',
      dataIndex: 'readyForMigration',
      key: 'readyForMigration',
      render: function ReadyForMigration(readyForMigration: boolean) {
        return <>{readyForMigration ? 'Yes' : 'No'}</>;
      },
    },
    {
      title: 'Initiated',
      dataIndex: 'migrationInitiated',
      key: 'migrationInitiated',
      render: function MigrationInitiated(migrationInitiated: boolean) {
        return <>{migrationInitiated ? 'Yes' : 'No'}</>;
      },
    },
    {
      title: 'Confirmed',
      dataIndex: 'migrationConfirmed',
      key: 'migrationConfirmed',
      render: function MigrationConfirmed(migrationConfirmed: boolean) {
        return <>{migrationConfirmed ? 'Yes' : 'No'}</>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={migrations.map((x) => {
        return {
          ...x,
          key: x.id,
        };
      })}
      bordered
      loading={loading}
    />
  );
};

export default MigrationTable;
