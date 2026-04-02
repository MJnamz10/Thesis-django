import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/accesslogs.css";
// Added Calendar, Download, and Search icons from lucide-react
import { UserPen, Calendar, Download, Search } from 'lucide-react';
import AdminMenu from './AdminMenu.jsx';

export default function AccessLogs() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State to track which filter is currently active
  const [activeFilter, setActiveFilter] = useState("All");

return (
    <div className="page">
      
      {/* 1. Wrap the top row and nav inside the header! */}
      <header className="header">
        <div className="header-top-row">
          <div className="header-left">
            <img src="/images/logo.png" alt="logo" className="logo" />
            <h1 className="school">
              University of Science and Technology of Southern Philippines
            </h1>
          </div>
 
          <div className="header-right">
            <AdminMenu />
          </div>
        </div>
 
        {/* Sidebar Navigation */}
        <nav className="container1">
          <div
            className={location.pathname === "/dashboard" ? "active-item" : "item"}
            onClick={() => navigate("/dashboard")}
          >
            <img src="/images/Icon.png" className="icon1" alt="icon" />
            Dashboard
          </div>

          <div
            className={location.pathname === "/accesslogs" ? "active-item" : "item"}
            onClick={() => navigate("/accesslogs")}
          >
            <img src="/images/Icon (2).png" className="icon3" alt="icon" />
            Access Logs
          </div>
          <div
            className={location.pathname === "/managestudentrecords" ? "active-item" : "item"}
            onClick={() => navigate("/managestudentrecords")}
          >
            <UserPen className="icon2" alt="icon" />
            Manage Student Records
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main">
        <div className="container2">
          
          {/* --- Top Header Row: Titles + Date/Export Filters --- */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div className="text1" style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Access Logs</div>
              <div className="text2" style={{ margin: '4px 0 0 0', color: 'gray' }}>Complete history of all access attempts</div>
            </div>
            
            {/* Top Right Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E4E7EC', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}>
                Today
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F9FAFB', border: '1px solid #E4E7EC', borderRadius: '8px', padding: '0 12px' }}>
                <input 
                  type="date" 
                  style={{ border: 'none', backgroundColor: 'transparent', padding: '8px 0', outline: 'none', color: '#344054', fontFamily: 'inherit' }} 
                />
              </div>

              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E4E7EC', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* --- Second Row: Search Bar + Status Filters --- */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            
            <div style={{ position: 'relative', flex: 1, maxWidth: '1020px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 36px', 
                  borderRadius: '8px', 
                  border: '1px solid #E4E7EC', 
                  backgroundColor: '#F9FAFB', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dynamic Status Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {["All", "Verified", "Not Verified"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E4E7EC',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: activeFilter === status ? '#0A0A0A' : '#FFFFFF',
                    color: activeFilter === status ? '#FFFFFF' : '#344054',
                  }} /* 👉 Fixed the stray 'Filter' text here! */
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table Area */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Program & Year</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {/* Data rows will go here */}
              </tbody>
            </table>
          </div>
          
        </div>
      </main>
    </div>
  );
}