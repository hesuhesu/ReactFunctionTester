/* 사용 방법 : <Select options={options} value={selectedValue} onChange={setSelectedValue} className="" /> */

function Select ({ 
    options, 
    value, 
    onChange, 
    className = "" 
  }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

export default Select;