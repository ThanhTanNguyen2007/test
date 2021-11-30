import React, { useState } from 'react';

import { Button, Table, Modal } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { InfoApiUsage, DataCache } from '../../types';

type PartneApiUsageTableProps = {
  info: InfoApiUsage[] | null;
};
const PartneApiUsageTable = ({ info }: PartneApiUsageTableProps) => {
  const columns: ColumnsType<InfoApiUsage> = [
    {
      title: 'Partner Email',
      dataIndex: 'partner',
      key: 'partner',
      align: 'center',
      render: function partnerEmail(partner) {
        return partner.user.email;
      },
    },
    {
      title: 'Total Endpoint Usage',
      dataIndex: 'apiUsage',
      key: 'apiUsage',
      align: 'center',
      render: function totalApiUsage(apiUsage) {
        return apiUsage.length;
      },
    },
    {
      title: 'Detail',
      align: 'center',
      render: function Detail(info) {
        const [visible, setVisible] = useState<boolean>(false);
        const [dataSource, setDataSource] = useState<DataCache[]>();
        const columns = [
          {
            title: 'API',
            dataIndex: 'key',
            key: 'key',
            render: function refactorKey(key: string) {
              return key.split(':')[2].toLocaleUpperCase();
            },
          },
          {
            title: 'Total Usage',
            dataIndex: 'total',
            key: 'total',
          },
        ];
        const onDetailChanged = async (info: InfoApiUsage) => {
          try {
            setVisible(true);
            setDataSource(info.apiUsage);
          } catch (error) {
            console.log(error);
          }
        };
        return (
          <>
            <Button type="primary" shape="round" onClick={() => onDetailChanged(info)}>
              See more
            </Button>
            <Modal
              title="Detail API Router Usage "
              // centered
              width={500}
              visible={visible}
              onOk={() => setVisible(false)}
              onCancel={() => setVisible(false)}
            >
              <Table dataSource={dataSource} columns={columns} />
            </Modal>
          </>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={info?.map((x) => {
        return {
          ...x,
          key: x,
        };
      })}
    />
  );
};

export default PartneApiUsageTable;
