import React, { useEffect, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Upload, message } from 'antd';

import * as api from '../../api';
import config from '../../config';
import { WABAMigration } from '../../types';
import MigrationTable from './MigrationTable';

type Props = {
  isAdmin: boolean | null;
  email: string | null;
};
export default function MigrationStatus({ isAdmin, email }: Props) {
  const [migrations, setMigrations] = useState<WABAMigration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWabaMigration();
  }, []);

  const fetchWabaMigration = async () => {
    setLoading(true);
    const migrations = await api.migration.find();
    if (migrations) {
      setMigrations(migrations);
    }
    setLoading(false);
  };

  const props = {
    name: 'migrationList',
    action: `${config.SERVER_BASE_URL}/api/migration/upload`,
    withCredentials: true,
    async onChange(info: any) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        const errorList = info.file.response;
        if (errorList && errorList.length !== 0) {
          errorList.forEach((error: string) => message.error(error, 5));
        }
        await fetchWabaMigration();
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <Card title="Migrations" className="text-center migration-status">
      {isAdmin && (
        <div className="upload">
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
          ,
        </div>
      )}
      {migrations && <MigrationTable email={email} migrations={migrations} loading={loading} isAdmin={isAdmin} />}
    </Card>
  );
}
