import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserPen, Wifi, Clock, LayoutDashboard, ClipboardList } from "lucide-react";
import AdminMenu from "./AdminMenu.jsx"; 
import "../css/header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 👉 Live Clock State
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update the time every 1 second
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format the time (e.g., "03:35:22 PM")
  const timeString = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Format the date (e.g., "Thu, Apr 2, 2026")
  const dateString = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="header">
      
      {/* --- TOP ROW --- */}
      <div className="header-top-row">
        
        {/* Left: Logo */}
        <div className="header-left">
          <img src="/images/logo.png" alt="logo" className="logo" />
        </div>

        {/* Middle: School Info & Status */}
        <div className="header-middle">
          <div className="campus-title">
            <span className="ustp-text">USTP | CDO Campus</span>
            <span className="online-dot"></span>
          </div>
          <div className="campus-subtitle">
            <Wifi size={16} className="wifi-icon" />
            <span className="scanner-status">QR Scanner: Online</span>
            <span className="separator">•</span>
            <span className="school-name">University of Science and Technology of Southern Philippines</span>
          </div>
        </div>

        {/* Right: Live Clock & Admin Menu */}
        <div className="header-right">
          <div className="clock-pill">
            <Clock size={24} className="clock-icon" />
            <div className="clock-text">
              <div className="time">{timeString}</div>
              <div className="date">{dateString}</div>
            </div>
          </div>
          <AdminMenu />
        </div>
      </div>

      {/* --- BOTTOM ROW: Navigation Bar --- */}
      <nav className="container1">
        <div
          className={location.pathname === "/dashboard" ? "active-item" : "item"}
          onClick={() => navigate("/dashboard")}
        >
         <span>Dashboard</span>
        </div>

        <div
          className={location.pathname === "/accesslogs" ? "active-item" : "item"}
          onClick={() => navigate("/accesslogs")}
        >
       <span>Access Logs</span>
        </div>

        <div
          className={location.pathname === "/managestudentrecords" ? "active-item" : "item"}
          onClick={() => navigate("/managestudentrecords")}
        >
         <span>Manage Student Records</span>
        </div>
      </nav>
      
    </header>
  );
}