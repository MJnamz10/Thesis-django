import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/dashboard.css";
import { UserPen, LogOut } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE;

  const [stats, setStats] = useState({
    totalStudents: 0,
    grantedToday: 0,
    deniedToday: 0,
    trafficToday: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setStats({
        totalStudents: 1240,
        grantedToday: 312,
        deniedToday: 18,
        trafficToday: 330,
      });
      setLoading(false);
    }, 800);
  }, []);
const handleLogout = () => {
    // 1. Shred the tokens from both local and session storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    
    // Note: We intentionally DO NOT remove "saved_email" 
    // so the "Remember Me" feature still works next time!

    // 2. Kick them back to the login page
    navigate("/");
  };
  return (
    <div className="page">
      <header className="header">
        <img src="/images/logo.png" alt="logo" className="logo" />
        <h1 className="school">
          University of Science and Technology of Southern Philippines
        </h1>

        <nav className="container1">
          <div
            className={location.pathname === "/dashboard" ? "active-item" : "item"}
            onClick={() => navigate("/dashboard")}
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
              location.pathname === "/managestudentrecords"
                ? "active-item"
                : "item"
            }
            onClick={() => navigate("/managestudentrecords")}
          >
            <UserPen className="icon2" />
            Manage Student Records
          </div>
          <div 
            className="item" 
            onClick={handleLogout} 
            style={{ color: '#dc2626', fontWeight: 'bold' }} // Making it red so it stands out!
          >
            <LogOut size={16} style={{ marginRight: '6px' }} />
            Logout
          </div>
        </nav>
      </header>

      <main className="main">
        <section className="dash-containers">
          <div className="dash-item">
            <p className="title1">Total Students</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "blue" }}>
              {loading ? "..." : stats.totalStudents}
            </p>
            <img src="/images/Dashboard.png" className="icons" alt="" />
          </div>

          <div className="dash-item">
            <p className="title1">Access Granted Today</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "green" }}>
              {loading ? "..." : stats.grantedToday}
            </p>
            <img src="/images/Dashboard (1).png" className="icons" alt="" />
          </div>

          <div className="dash-item">
            <p className="title1">Access Denied Today</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "red" }}>
              {loading ? "..." : stats.deniedToday}
            </p>
            <img src="/images/Dashboard (2).png" className="icons" alt="" />
          </div>

          <div className="dash-item">
            <p className="title1">Today's Traffic</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "orange" }}>
              {loading ? "..." : stats.trafficToday}
            </p>
            <img src="/images/Dashboard (3).png" className="icons" alt="" />
          </div>
        </section>

        <section className="container6"></section>

        <section className="dash-containers2">
          <div className="dash-header">
            <div className="txt1">
              <p>Access Status Overview</p>
            </div>
            <div className="txt2">
              <p>Today's verification results at Main Gate</p>
            </div>
          </div>

          <div className="dash-containers3">
            <div className="dash-item2 granted">
              <img src="/images/grant.png" alt="" className="icon4" />
              <p className="title2">Granted</p>
            </div>
            <div className="dash-item2 denied">
              <img src="/images/denied.png" alt="" className="icon5" />
              <p className="title2">Denied</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
