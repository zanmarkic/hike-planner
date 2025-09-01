// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MountainDetail from "./pages/MountainDetail";
import OrganizeTour from "./pages/OrganizeTour";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Prva stran s filtri in seznamom */}
        <Route path="/" element={<Home />} />

        {/* Detajl gore: /mountain/Triglav */}
        <Route path="/mountain/:name" element={<MountainDetail />} />

        {/* Organizacija ture */}
        <Route path="/organize" element={<OrganizeTour />} />

        {/* Vse ostalo preusmeri na domov */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
