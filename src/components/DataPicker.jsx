import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomDatePicker = ({ 
    value, 
    onChange,
    dateFormat = 'yyyy.MM.dd',
    minDate = new Date('2000-01-01'),
    maxDate = new Date(),
    placeholderText = '날짜를 선택하세요',
    isClearable = true,
    showMonthDropdown = true,
    showYearDropdown = true,
    dropdownMode = "select",
    disabled = false,
    className,
    customInput,
  }) => {
    return (
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat={dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        isClearable={isClearable}
        showMonthDropdown={showMonthDropdown}
        showYearDropdown={showYearDropdown}
        dropdownMode={dropdownMode}
        disabled={disabled}
        className={className}
        customInput={customInput}
        shouldCloseOnSelect
      />
    );
  };
  
  export default CustomDatePicker;