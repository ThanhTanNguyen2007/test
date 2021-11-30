import React, { useState } from 'react';

import Select from 'react-select';
import _ from 'lodash';
import { Button, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { format } from 'date-fns';

import * as api from '../../api';
import { Partner, User, UserStatusEnum } from '../../types';
import timezoneMapping from '../../consts/timezoneMapping';

type TimezoneOption = {
  value: string;
  label: string;
};
type PartnerTimezones = {
  [key: string]: TimezoneOption;
};

const timezones = timezoneMapping.map((zone) => {
  return {
    value: zone.tzCode,
    label: zone.label,
  };
});

type AccountsTableProps = {
  users: User[];
  updateUserPartnerInfo(userId: number, partner: Partner, timezone: string): void;
  changePartnerActivation(updatedPartner: Partner): void;
  isAdmin: boolean | null;
  page: number;
  size: number;
  total: number;
  onPaginationChanged(page: number, pageSize?: number | undefined): void;
};

const UsersTable = ({
  users,
  updateUserPartnerInfo,
  isAdmin,
  page,
  size,
  total,
  onPaginationChanged,
}: AccountsTableProps) => {
  const [partnerTimezones, setPartnerTimezones] = useState<PartnerTimezones>({});
  const onClickCreatePartner = (userId: number) => async () => {
    const timezone = partnerTimezones[userId].value;
    const partner = await api.partner.createPartner(userId, timezone);
    if (partner) {
      updateUserPartnerInfo(userId, partner, timezone);
    }
  };

  const updatePartnerTimezone = (userId: number, timezoneOption: TimezoneOption) => {
    const _partnerTimezones = _.cloneDeep(partnerTimezones);
    _partnerTimezones[userId] = timezoneOption;
    setPartnerTimezones(_partnerTimezones);
  };

  const columns: ColumnsType<User> = [
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Onboarding Status',
      key: 'status',
      dataIndex: 'status',
      align: 'center',
      render: function OnboardingStatus(status) {
        return status === UserStatusEnum.NotInitiated ? 'Not Initiated' : status;
      },
    },
  ];

  if (isAdmin) {
    columns.push(
      {
        title: 'Partner Email',
        dataIndex: 'uplineEmail',
        key: 'uplineEmail',
      },
      {
        title: 'Admin',
        dataIndex: 'isAdmin',
        align: 'center',
        key: 'isAdmin',
        render: function IsAdmin(isAdmin) {
          return isAdmin ? 'Yes' : '';
        },
      },
      {
        title: 'Partner ID',
        key: 'partner',
        align: 'center',
        render: function Partner(record: User) {
          return record.partner ? (
            record.partner.id
          ) : (
            <Button
              type="primary"
              onClick={onClickCreatePartner(record.id)}
              size="small"
              disabled={!partnerTimezones[record.id]}
            >
              Create Partner
            </Button>
          );
        },
      },
      {
        title: 'Partner Timezone',
        key: 'timezone',
        render: function SelectTimezone(record: User) {
          return record.partner ? (
            record.partner.timezone
          ) : (
            <Select
              onChange={(option) => {
                if (option?.value) {
                  updatePartnerTimezone(record.id, option);
                }
              }}
              styles={{ container: (provided) => ({ ...provided, fontSize: 12 }) }}
              options={timezones}
              value={partnerTimezones[record.id] || null}
              placeholder="Select Timezone"
            />
          );
        },
      },
      {
        title: 'Activation',
        key: 'activation',
        render: function Activation(text: unknown, record: User) {
          const [partner, setPartner] = useState(record?.partner);
          const [isLoading, setIsLoading] = useState(false);

          const onActivationChanged = async (partnerId: number | undefined, isActivated: boolean) => {
            try {
              setIsLoading(true);

              if (partnerId) {
                const updatedPartner = await api.partner.changeActivation(partnerId, isActivated);

                setPartner(updatedPartner);
              }
            } catch (error) {
              console.log(error.message);
            } finally {
              setIsLoading(false);
            }
          };

          if (!record.isAdmin && record.partner?.id) {
            return (
              <>
                {partner?.isActivated ? (
                  <Button
                    type="primary"
                    shape="round"
                    size="small"
                    loading={isLoading || false}
                    onClick={() => onActivationChanged(partner?.id, false)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    shape="round"
                    size="small"
                    loading={isLoading || false}
                    onClick={() => onActivationChanged(partner?.id, true)}
                  >
                    Activate
                  </Button>
                )}
              </>
            );
          }
          return;
        },
      },
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={users.map((x) => {
        return {
          ...x,
          key: x.id,
        };
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
  );
};

export default UsersTable;
