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
            <p className="title1">Access Verified Today</p>
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
                <p>Recent Access Activity</p>
              </div>
              <div className="txt2">
                <p>Latest student access attempts at Main Gate</p>
              </div>
            </div>

            <div
              style={{
                overflowX: "auto",
                border: "3px solid #ECECF0",
                borderRadius: "10px",
                overflow: "hidden",
                minHeight: "425px",
                height: "100%",
              }}
              >
              <table
                style={{
                  width: "100%", // 👈 not 100% so it can visually center
                  margin: "0 auto", // 👈 centers horizontally
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "18%",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Timestamp
                    </th>
                    <th
                      style={{
                        width: "16%",
                        textAlign: "center",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Student ID
                    </th>
                    <th
                      style={{
                        width: "20%",
                        textAlign: "center",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Student Name
                    </th>
                    <th
                      style={{
                        width: "16%",
                        textAlign: "center",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Program
                    </th>
                    <th
                      style={{
                        width: "10%",
                        textAlign: "center",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Year
                    </th>
                    <th
                      style={{
                        width: "20%",
                        textAlign: "center",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Validity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: "10px", color: "gray" }}
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : recentScans.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: "10px", color: "gray", textAlign: "center", verticalAlign: "middle", height: "37vh",}}
                      >
                        No scan records found.
                      </td>
                    </tr>
                  ) : (
                    recentScans.map((scan) => (
                      <tr key={scan.id}>
                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "6%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.timestamp}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "5%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.id_number}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "6%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.full_name}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "5.5%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.program}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "4%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.year_level}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            margin: "0 auto",
                            paddingLeft: "8 %",
                            padding: "10px",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {scan.validity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
