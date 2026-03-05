import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard.jsx";
import ManageStudentRecords from "./pages/managestudentrecords.jsx";
import AccessLogs from "./pages/accesslogs.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/managestudentrecords" element={<ManageStudentRecords />} />
        <Route path="/accesslogs" element={<AccessLogs />} />
      </Routes>
    </Router>
  );
}

export default App;
