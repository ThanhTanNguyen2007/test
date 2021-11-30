import React, { useState } from 'react';

import { format } from 'date-fns';
import { ColumnsType } from 'antd/lib/table';
import { Button, Table, notification } from 'antd';
import _ from 'lodash';

import * as api from '../../api';
import config from '../../config';
import { PhoneInfoModal } from '../PhoneInfoModal';
import { RemoveButton, ReloadButton } from '../../components';
import { Account, CreditLineState, Manager, PhoneNumber } from '../../types';

import { Link } from 'react-router-dom';

type AccountsTableProps = {
  accounts: Account[];
  isAdmin: boolean | null;
  partnerId: number | null;
  page: number;
  size: number;
  total: number;
  fetchData(): Promise<void>;
  updateAccountList(
    accountId: number,
    creditLineAllocationConfigId: string | null,
    creditLineState: CreditLineState,
  ): void;
  onPaginationChanged(page: number, pageSize?: number | undefined): void;
};

const notificationReloadSuccess = (wabaName: string) => {
  notification['success']({
    message: `Update WABA -${wabaName}- Successfully`,
  });
};

const AccountsTable = ({
  accounts,
  isAdmin,
  partnerId,
  page,
  size,
  total,
  fetchData,
  updateAccountList,
  onPaginationChanged,
}: AccountsTableProps) => {
  const [selectedPhoneNumber, setShowPhoneNumber] = useState<PhoneNumber | null>(null);

  const onClickEnableCreditLine = (accountId: number, managerId: number) => async () => {
    const manager = await api.manager.enableCreditLine(managerId);
    if (!manager) {
      return;
    }
    updateAccountList(accountId, manager.creditLineAllocationConfigId, manager.creditLineState);
  };
  const onClickDisableCreditLine = (accountId: number, managerId: number) => async () => {
    const manager = await api.manager.disableCreditLine(managerId);
    if (!manager) {
      return;
    }
    updateAccountList(accountId, manager.creditLineAllocationConfigId, manager.creditLineState);
  };

  const columns: ColumnsType<Account> = [
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: function CreatedAt(createdAt) {
        return <>{format(new Date(createdAt), 'd MMM yyyy')}</>;
      },
    },
    {
      title: 'WABA ID',
      dataIndex: 'wabaId',
      key: 'wabaId',
      align: 'center',
    },
    {
      title: 'WABA Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
    },
    {
      title: 'Owner Email',
      dataIndex: 'ownerEmail',
      key: 'ownerEmail',
      align: 'center',
    },
    {
      title: 'Timezone',
      dataIndex: 'timezone',
      key: 'timezone',
      align: 'center',
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      align: 'center',
    },
    {
      title: 'Phone Numbers',
      dataIndex: 'wabaId',
      key: 'phoneNumbers',
      align: 'center',
      render: function PhoneNumber(wabaId: string) {
        return <Link to={{ pathname: '/phoneNumbers', state: { wabaId } }}>More info</Link>;
      },
    },
  ];

  if (!partnerId) {
    columns.push({
      title: 'Partner Email',
      dataIndex: 'manager',
      align: 'center',
      key: 'manager',
      render: function Manager(manager: Manager) {
        return <>{manager?.partner?.user?.email || ''}</>;
      },
    });
  } else {
    columns.push({
      title: 'Is Linked User?',
      dataIndex: 'manager',
      align: 'center',
      key: 'manager',
      render: function Manager(manager: Manager) {
        return <>{manager?.partner?.user?.email ? 'Yes' : 'No'}</>;
      },
    });
  }

  columns.push({
    title: 'WABA Status',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  });

  if (isAdmin || partnerId) {
    columns.push(
      {
        title: 'Credit Line Status',
        align: 'center',
        key: 'manager',
        render: function CreditLineStatus(record: Account) {
          return (
            <>
              {config.KEYREPLY_BUSINESS_ID !== record.businessId &&
                record?.manager?.creditLineState.toString().replace('_', ' ')}
            </>
          );
        },
      },
      {
        title: 'Credit Line',
        align: 'center',
        key: 'creditLine',
        render: function CreditLine(text: unknown, record: Account) {
          return (
            <>
              {config.KEYREPLY_BUSINESS_ID !== record.businessId ? (
                <>
                  {record?.manager?.creditLineAllocationConfigId && (
                    <div className="flex flex-jc-sb">
                      <span className="mr-10">On</span>
                      <Button
                        type="primary"
                        danger
                        shape="round"
                        size="small"
                        onClick={onClickDisableCreditLine(record.id, record.manager.id)}
                      >
                        Disable
                      </Button>
                    </div>
                  )}
                  {record.manager && !record?.manager?.creditLineAllocationConfigId && (
                    <div className="flex flex-jc-sb">
                      <span className="mr-10">Off</span>
                      <Button
                        type="primary"
                        shape="round"
                        size="small"
                        onClick={onClickEnableCreditLine(record.id, record.manager.id)}
                      >
                        Enable
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <></>
              )}
            </>
          );
        },
      },
    );
  }

  if (isAdmin) {
    columns.push({
      title: '',
      align: 'center',
      key: 'tools',
      render: function Tools(record: Account) {
        const handleRemove = async () => {
          try {
            const isRemove = await api.account.remove(record.id);
            if (isRemove) {
              await fetchData();
            }
          } catch (error) {
            throw error;
          }
        };
        const handleReload = async () => {
          try {
            const isReload = await api.account.reload(record.wabaId);
            if (isReload) {
              await fetchData();
              notificationReloadSuccess(record.name);
            }
          } catch (error) {
            throw error;
          }
        };
        return (
          <div className="flex flex-jc-c flex-ai-c ">
            <div className="mr-10">
              <ReloadButton handleReload={handleReload} uniqueValue={record.name} />
            </div>
            <>
              <RemoveButton handleRemove={handleRemove} uniqueValue={record.name} />
            </>
          </div>
        );
      },
    });
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={accounts.map((acc) => {
          return { ...acc, key: acc.id };
        })}
        bordered
        pagination={{
          defaultCurrent: 1,
          current: page,
          total: total,
          showSizeChanger: true,
          defaultPageSize: 10,
          pageSize: size,
          onChange: (page: number, pageSize?: number | undefined) => onPaginationChanged(page, pageSize),
        }}
      />
      <PhoneInfoModal
        show={!!selectedPhoneNumber}
        phoneNumberInfo={selectedPhoneNumber}
        handleClose={() => {
          setShowPhoneNumber(null);
        }}
      />
    </>
  );
};

export default AccountsTable;
