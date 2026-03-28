import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard.jsx";
import ManageStudentRecords from "./pages/managestudentrecords.jsx";
import AccessLogs from "./pages/accesslogs.jsx";
import Login from "./pages/login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/managestudentrecords"
          element={<ManageStudentRecords />}
        />
        <Route path="/accesslogs" element={<AccessLogs />} />
      </Routes>
    </Router>
  );
}

export default App;
