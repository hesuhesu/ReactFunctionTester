import React from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import WebEditor from "./components/WebEditor";
import Review from "./components/Review";

function App() {

  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<WebEditor />}/>
        <Route path = "/review" element = {<Review/>}/>
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;