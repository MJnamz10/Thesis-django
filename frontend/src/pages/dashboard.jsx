import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/dashboard.css";
import { UserPen, LogOut } from "lucide-react";

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

  const displayValue = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "" ||
      val === "Not in Masterlist"
    ) {
      return "N/A";
    }
    return val;
  };

  const getPhotoSrc = (photo) => {
    if (!photo) return "/images/default-avatar.png";
    if (photo.startsWith("http")) return photo;
    return `${API_BASE}${photo}`;
  };

  const fetchDashboardData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(`${API_BASE}/api/verifid/dashboard-data`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();

      const newStats = {
        totalStudents: data.stats?.totalStudents || 0,
        grantedToday: data.stats?.grantedToday || 0,
        deniedToday: data.stats?.deniedToday || 0,
        trafficToday: data.stats?.trafficToday || 0,
      };

      setStats((prev) =>
        JSON.stringify(prev) === JSON.stringify(newStats) ? prev : newStats,
      );

      setRecentScans((prev) =>
        JSON.stringify(prev) === JSON.stringify(data.recentScans || [])
          ? prev
          : data.recentScans || [],
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");

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
            className={
              location.pathname === "/dashboard" ? "active-item" : "item"
            }
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
            style={{ color: "#dc2626", fontWeight: "bold" }}
          >
            <LogOut size={16} style={{ marginRight: "6px" }} />
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
            <p style={{ fontSize: 28, fontWeight: 700, color: "purple" }}>
              {loading ? "..." : stats.trafficToday}
            </p>
            <img src="/images/Dashboard (3).png" className="icons" alt="" />
          </div>
        </section>

        <section className="container6">
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
                overflowY: "auto",
                minHeight: "425px",
                height: "100%",
              }}
            >
              <table
                style={{
                  width: "100%",
                  margin: "0 auto",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "10%",
                        padding: "10px",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                        textAlign: "center",
                      }}
                    >
                      Photo
                    </th>
                    <th
                      style={{
                        width: "18%",
                        padding: "10px",
                        textAlign: "center",
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                      }}
                    >
                      Timestamp
                    </th>
                    <th
                      style={{
                        width: "16%",
                        paddingRight: "8%",
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
                        width: "19%",
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
                        colSpan="7"
                        style={{ padding: "10px", color: "gray" }}
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : recentScans.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          padding: "10px",
                          color: "gray",
                          textAlign: "center",
                          verticalAlign: "middle",
                          height: "37vh",
                        }}
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
                            paddingLeft: "3%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                          }}
                        >
                          {scan.id_number === "Not in Masterlist" ||
                          !scan.full_name ? (
                            <div
                              style={{
                                width: "90px",
                                height: "90px",
                                borderRadius: "8px",
                                border: "1px dashed #9ca3af",
                                background: "#fef2f2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "5px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#9ca3af",
                                  textTransform: "uppercase",
                                  lineHeight: "1.2",
                                }}
                              >
                                No Student <br /> Record
                              </span>
                            </div>
                          ) : (
                            <img
                              src={getPhotoSrc(scan.photo)}
                              alt={scan.full_name || "Student"}
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "1px solid #E4E7EC",
                                background: "#F9FAFB",
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "/images/default-avatar.png";
                              }}
                            />
                          )}
                        </td>

                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "6.3%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {displayValue(scan.timestamp)}
                        </td>

                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "4.5%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {displayValue(scan.id_number)}
                        </td>

                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "6%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {displayValue(scan.full_name)}
                        </td>

                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "6%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {displayValue(scan.program)}
                        </td>

                        <td
                          style={{
                            textAlign: "left",
                            paddingLeft: "4.5%",
                            color: "gray",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {displayValue(scan.year_level)}
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "white",
                              backgroundColor:
                                scan.validity === "VERIFIED" &&
                                scan.full_name &&
                                scan.id_number !== "Not in Masterlist"
                                  ? "#22c55e" // green
                                  : !scan.full_name ||
                                      scan.id_number === "Not in Masterlist"
                                    ? "#9ca3af" // gray for INVALID
                                    : "#ff0000", // red for other cases (optional)
                            }}
                          >
                            {!scan.full_name ||
                            scan.id_number === "Not in Masterlist"
                              ? "INVALID"
                              : scan.validity || "UNKNOWN"}
                          </span>
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
