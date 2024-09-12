import React, { useState } from 'react';
import Three from "./components/Three";
import WebEditor from "./components/WebEditor";

function App() {
  const [true1, setTrue1] = useState(false);
  
  const button_1 = () => {
    setTrue1(!true1);
  }
  return (
    <div>
      <Three></Three>
      <button onClick={button_1}>WebGL Editor</button>
      {true1 && <WebEditor></WebEditor>}
    </div>
    
  );
}

export default App;