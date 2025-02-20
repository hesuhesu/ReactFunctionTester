import { useState } from "react";
import RandomInput from "./components/RandomInput";
import Select from "./components/Select";
import Chart from "./components/Chart";
import CustomDatePicker from "./components/DataPicker";
function App() {
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const options = [
    { value: "1", label: "옵션 1" },
    { value: "2", label: "옵션 2" },
    { value: "3", label: "옵션 3" },
  ];

  const chartData = {
    labels: ['1월', '2월', '3월', '4월', '5월'],
    datasets: [
      {
        label: '매출',
        data: [12, 19, 3, 5, 2],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '월별 매출 현황',
      },
    },
  };

  return (
    <div className="App">
      <RandomInput/>
      <Select
        options={options}
        value={selectedValue}
        onChange={setSelectedValue}
        className="select"
      />
      <CustomDatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        dateFormat="yyyy년 MM월 dd일"
        minDate={new Date('2020-01-01')}
        maxDate={new Date('2025-12-31')}
        placeholderText="생년월일을 선택하세요"
        isClearable={false}
        disabled={false}
      />
      <Chart 
        type="line"
        data={chartData}
        options={chartOptions}
        className=""
      />
    </div>
  );
}

export default App;
