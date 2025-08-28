import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MountainDetail from "./pages/MountainDetail";
import OrganizeTour from "./pages/OrganizeTour";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gora/:id" element={<MountainDetail />} />
        <Route path="/mountain/:name" element={<MountainDetail />} />
        <Route path="/tour/:name" element={<OrganizeTour />} />
      </Routes>
    </Router>
  );
}

export default App;
