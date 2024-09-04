import React, { useState } from 'react';

const ColorPicker = () => {
  const [color, setColor] = useState('#ffffff');
  const [showPicker, setShowPicker] = useState(false);

  const handleColorChange = (event) => {
    setColor(event.target.value);
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  return (
    <div>
      <button onClick={togglePicker}>색상 선택</button>
      {showPicker && (
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
        />
      )}
      <div style={{ width: '100px', height: '100px', backgroundColor: color }} />
    </div>
  );
};

export default ColorPicker;