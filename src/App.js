import React, { useState } from 'react';
import ThreeDUpload from "./components/ThreeDUpload";
import WebEditor from "./components/WebEditor";

function App() {
  const [true1, setTrue1] = useState(false);
  const handleTrue = () => { setTrue1(!true1); }

  return (
    <div>
      <ThreeDUpload/>
      {true1 ? <><button onClick={handleTrue}>WebEditor 삭제</button><WebEditor/></> : <button onClick={handleTrue}>WebEditor 생성</button>}
    </div>
  );
}

export default App;