import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/dashboard.css";
import { RefreshCw, Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import Header from "./Header.jsx";

export default function Dashboard() {
  document.title = "Dashboard | Verifid";
  const navigate = useNavigate();
  const location = useLocation();
  const [scannerOnline, setScannerOnline] = useState(false); // State to track QR scanner status

  const [stats, setStats] = useState({
    totalStudents: 0,
    verifiedToday: 0,
    unverifiedToday: 0,
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

  // 👉 UPDATED: SVG Approach for Initials (Zero Network Requests)
  const getPhotoSrc = (photo, fullName) => {
    // 1. If photo exists, return it
    if (photo) {
      if (photo.startsWith("http")) return photo;
      return `${import.meta.env.VITE_API_BASE}${photo}`;
    }

    // 2. Generate Local SVG if no photo but has a valid name
    if (fullName && fullName !== "Not in Masterlist") {
      const nameParts = fullName.trim().split(" ");
      const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0][0].toUpperCase();

      return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
        <rect width='128' height='128' fill='%231c398e'/>
        <text x='50%' y='50%' font-family='Arial, sans-serif' font-size='50' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='central'>${initials}</text>
      </svg>`;
    }

    // 3. Absolute fallback just in case a record has no name and no photo
    return "/images/default-avatar.png";
  };

  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {setLoading(true);} 

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/verifid/dashboard-data`,
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();

      setScannerOnline(data.scannerOnline); 

      setStats({
        totalStudents: data.stats?.totalStudents || 0,
        verifiedToday: data.stats?.verifiedToday || 0,
        unverifiedToday: data.stats?.unverifiedToday || 0,
        trafficToday: data.stats?.trafficToday || 0,
      });

      setRecentScans(data.recentScans || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setScannerOnline(false); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header scannerOnline={scannerOnline} />
      <div className="page">
        <main className="main">
          <section className="dash-containers">
            
            {/* Card 1: Total Students */}
            <div className="dash-item">
              <div className="card-top">
                <span className="card-value">{loading ? "..." : stats.totalStudents}</span>
                <div className="card-icon-wrapper">
                  <Users size={20} />
                </div>
              </div>
              <div className="card-bottom">
                <span className="card-label">Total Students</span>
              </div>
            </div>

            {/* Card 2: Successful Verifications */}
            <div className="dash-item">
              <div className="card-top">
                <span className="card-value">{loading ? "..." : stats.verifiedToday}</span>
                <div className="card-icon-wrapper">
                  <UserCheck size={20} />
                </div>
              </div>
              <div className="card-bottom">
                <span className="card-label">Verified Students</span>
              </div>
            </div>

            {/* Card 3: Failed Verifications */}
            <div className="dash-item">
              <div className="card-top">
                <span className="card-value">{loading ? "..." : stats.unverifiedToday}</span>
                <div className="card-icon-wrapper">
                  <UserX size={20} />
                </div>
              </div>
              <div className="card-bottom">
                <span className="card-label">Unverified Students</span>
              </div>
            </div>

            {/* Card 4: Total Access Attempts */}
            <div className="dash-item">
              <div className="card-top">
                <span className="card-value">{loading ? "..." : stats.trafficToday}</span>
                <div className="card-icon-wrapper">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="card-bottom">
                <span className="card-label">Total Access Attempts</span>
              </div>
            </div>

          </section>

          <section className="container6">
            <section className="dash-containers2">
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              
              <div className="dash-header">
                <div className="txt1">
                  <p>Recent Access Activity</p>
                </div>
                <div className="txt2">
                  <p>Latest student access attempts at Main Gate</p>
                </div>
              </div>

              <button 
                className="refresh-btn" 
                onClick={() => fetchDashboardData(true)}
              >
                Refresh <RefreshCw size={16} />
              </button>

            </div>

              <div className="table-containerD">
                <table className="tableD" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center" }}>Photo</th>
                      <th style={{ textAlign: "center" }}>Timestamp</th>
                      <th style={{ textAlign: "center" }}>Student ID</th>
                      <th style={{ textAlign: "center" }}>Student Name</th>
                      <th style={{ textAlign: "center" }}>Program</th>
                      <th style={{ textAlign: "center" }}>Year</th>
                      <th style={{ textAlign: "center" }}>Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{ padding: "10px", color: "gray", textAlign: "center" }}
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
                            fontSize: "16px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            height: "15vh",
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
                                src={getPhotoSrc(scan.photo, scan.full_name)}
                                alt={scan.full_name || "Student"}
                                style={{
                                  width: "50px",
                                  height: "50px",
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
                                    ? "#22c55e" 
                                    : !scan.full_name ||
                                        scan.id_number === "Not in Masterlist"
                                      ? "#000000" 
                                      : "#ff0000", 
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
    </>
  );
}