import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/dashboard.css";
import { UserPen } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const [stats, setStats] = useState({
    totalStudents: 0,
    grantedToday: 0,
    deniedToday: 0,
    trafficToday: 0,
  });

  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/verifid/dashboard-data`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      setStats({
        totalStudents: data.stats?.totalStudents || 0,
        grantedToday: data.stats?.grantedToday || 0,
        deniedToday: data.stats?.deniedToday || 0,
        trafficToday: data.stats?.trafficToday || 0,
      });

      setRecentScans(data.recentScans || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
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
              location.pathname === "/managestudentrecords"
                ? "active-item"
                : "item"
            }
            onClick={() => navigate("/managestudentrecords")}
          >
            <UserPen className="icon2" />
            Manage Student Records
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

        <section className="container6">
          {" "}
          <section className="dash-containers2" style={{ marginTop: "20px" }}>
            <div className="dash-header">
              <div className="txt1">
                <p>Recent Scans</p>
              </div>
              <div className="txt2">
                <p>Same records saved by the scanner app</p>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>
                      Timestamp
                    </th>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>
                      ID Number
                    </th>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>
                      Program
                    </th>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>
                      Year Level
                    </th>
                    <th style={{ textAlign: "left", padding: "10px", color: "gray" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "10px", color: "gray" }}>
                        Loading...
                      </td>
                    </tr>
                  ) : recentScans.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "10px", color: "gray" }}>
                        No scan records found.
                      </td>
                    </tr>
                  ) : (
                    recentScans.map((scan) => (
                      <tr key={scan.id}>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.timestamp}</td>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.id_number}</td>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.full_name}</td>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.program}</td>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.year_level}</td>
                        <td style={{ padding: "10px", color: "gray" }}>{scan.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

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
              <p className="title2">
                Granted: {loading ? "..." : stats.grantedToday}
              </p>
            </div>
            <div className="dash-item2 denied">
              <img src="/images/denied.png" alt="" className="icon5" />
              <p className="title2">
                Denied: {loading ? "..." : stats.deniedToday}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
