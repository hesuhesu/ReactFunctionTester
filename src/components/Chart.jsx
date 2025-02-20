import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

function Chart ({ type, data, options }) {
  // 차트 타입에 따라 다른 컴포넌트 렌더링
  function renderChart () {
    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      default:
        return <div>지원하지 않는 차트 타입입니다.</div>;
    }
  };

  return <div className="chart-container">{renderChart()}</div>;
};

export default Chart;
