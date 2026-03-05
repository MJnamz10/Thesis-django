import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/accesslogs.css";
import { UserPen } from 'lucide-react';


export default function AccessLogs() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <img src="/images/logo.png" alt="logo" className="logo" />
      <h1 className="school">
        University of Science and Technology of Southern Philippines
      </h1>
      <div className="container1">
        <div
          className={location.pathname === "/" ? "active-item" : "item"}
          onClick={() => navigate("/")}
        >
          <img src="/images/Icon.png" className="icon1" alt="icon" />
          Dashboard
        </div>

        <div
          className={
            location.pathname === "/accesslogs" ? "active-item" : "item"
          }
          onClick={() => navigate("/accesslogs")}
        >
          <img src="/images/Icon (2).png" className="icon3" alt="icon" />
          Access Logs
        </div>
          <div
          className={
            location.pathname === "/managestudentrecords" ? "active-item" : "item"
          }
          onClick={() => navigate("/managestudentrecords")}
        >
          <UserPen className="icon2" alt="icon" />
          Manage Student Records
        </div>
      </div>

      <div className="container2">
        <div className="text1">
          <p>Access Logs</p>
        </div>
        <div className="text2">
          <p>Complete history of all access attempts</p>
        </div>
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name or student ID..."
        ></input>
        <img
          src="/images/search-icon.png"
          className="search-icon"
          alt="search"
        />
        <button className="export-button">Export CSV</button>
        <img
          src="/images/export-icon.png"
          className="export-icon"
          alt="export"
        />
        <div className="buttons">
          <button className="select-button">All</button>
          <button className="select-button">Granted</button>
          <button className="select-button">Denied</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thread>
              <tr>
                <th>Timestamp</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Program & Year</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thread>
          </table>
        </div>
      </div>
    </div>
  );
}
