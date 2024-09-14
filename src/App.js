import React, { useState } from 'react';
import Three from "./components/Three";
import WebEditor from "./components/WebEditor";

function App() {
  const [true1, setTrue1] = useState(false);
  const [true2, setTrue2] = useState(false);
  
  const button_1 = () => {
    setTrue1(!true1);
  }
  const button_2 = () => {
    setTrue2(!true2);
  }
  return (
    <div>
      <button onClick={button_1}>3D Upload</button>
      <button onClick={button_2}>WebGL Editor</button>
      {true1 && <Three></Three>}
      {true2 && <WebEditor></WebEditor>}
    </div>
    
  );
}

export default App;