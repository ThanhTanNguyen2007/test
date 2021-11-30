import React, { useState } from 'react';

import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { Button, notification } from 'antd';
import { ExportOutlined } from '@ant-design/icons';

type Props = {
  style?: any;
  getExportData(): Promise<any[]>;
  fileName: string;
  multiSheets?: {
    fieldSheetName: string;
  };
};

const ExportCSV = ({ style, getExportData, fileName, multiSheets }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  const fileExtension = '.xlsx';

  const exportToCSV = async (csvData: any[] | [], fileName: string) => {
    try {
      let wb;
      if (multiSheets) {
        wb = { SheetNames: [] as any, Sheets: {} as any };
        for (const item of csvData) {
          const ws = XLSX.utils.json_to_sheet([item]);
          wb.SheetNames.push(item[multiSheets.fieldSheetName].toUpperCase());
          wb.Sheets[item[multiSheets.fieldSheetName].toUpperCase()] = ws; // First workbook is named "Sheet1", you can change it
        }
      } else {
        const ws = XLSX.utils.json_to_sheet(csvData);
        wb = { Sheets: { data: ws }, SheetNames: ['data'] };
      }
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: fileType });
      FileSaver.saveAs(data, fileName + fileExtension);
    } catch (error) {
      console.log(error);
      notification.error({
        message: `Export Failed`,
        description: `${error}`,
        placement: 'bottomLeft',
      });
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const csvData = await getExportData();
      csvData && csvData.length > 0
        ? exportToCSV(csvData, fileName)
        : notification.warning({
            message: `No Data to Export`,
            placement: 'bottomLeft',
          });
    } catch (error) {
      console.log(error);
      notification.error({
        message: `Export Failed`,
        description: `${error}`,
        placement: 'bottomLeft',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button style={style} icon={<ExportOutlined />} type="primary" onClick={handleExport} loading={isLoading}>
      Export
    </Button>
  );
};

export default ExportCSV;
