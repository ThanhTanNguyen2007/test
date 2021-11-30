import React from 'react';

import { DualAxes } from '@ant-design/charts';

type AnalyticsChart = {
  date: string;
  sent: number;
  delivered: number;
}[];

type UsageChartProps = {
  usageList: AnalyticsChart;
  loading: boolean;
  totalSent: number;
  totalDelivered: number;
};

const UsageChart = ({ usageList, loading, totalSent, totalDelivered }: UsageChartProps) => {
  const config = {
    data: [usageList, usageList],
    xField: 'date',
    yField: ['sent', 'delivered'],
    geometryOptions: [
      {
        geometry: 'line',
        color: '#5B8FF9',
      },
      {
        geometry: 'line',
        color: '#5AD8A6',
      },
    ],
    interactions: [{ type: 'element-highlight' }, { type: 'active-region' }],
  };
  return (
    <>
      <div className="flex flex-ai-c">
        <div>
          <h3>{totalSent}</h3>
          <h4 style={{ color: '#5B8FF9' }}>Message Sent</h4>
        </div>
        <div style={{ marginLeft: '50px' }}>
          <h3>{totalDelivered}</h3>
          <h4 style={{ color: '#5AD8A6' }}>Message Delivered</h4>
        </div>
      </div>
      <DualAxes loading={loading} autoFit {...config} />
    </>
  );
};

export default UsageChart;
