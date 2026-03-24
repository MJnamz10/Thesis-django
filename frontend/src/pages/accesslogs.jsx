import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/accesslogs.css";
// Added Calendar, Download, and Search icons from lucide-react
import { UserPen, Calendar, Download, Search } from "lucide-react";

export default function AccessLogs() {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPhotoSrc = (photo) => {
    if (!photo) return "/images/default-avatar.png";
    if (photo.startsWith("http")) return photo;
    return `${API_BASE}${photo}`;
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/verifid/all-logs`);

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // State to track which filter is currently active
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div>
      <img src="/images/logo.png" alt="logo" className="logo" />
      <h1 className="school">
        University of Science and Technology of Southern Philippines
      </h1>

      {/* Sidebar Navigation */}
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
            location.pathname === "/managestudentrecords"
              ? "active-item"
              : "item"
          }
          onClick={() => navigate("/managestudentrecords")}
        >
          <UserPen className="icon2" alt="icon" />
          Manage Student Records
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container2">
        {/* --- Top Header Row: Titles + Date/Export Filters --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              className="text1"
              style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}
            >
              Access Logs
            </div>
            <div
              className="text2"
              style={{ margin: "4px 0 0 0", color: "gray" }}
            >
              Complete history of all access attempts
            </div>
          </div>

          {/* Top Right Filters */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E4E7EC",
                backgroundColor: "white",
                cursor: "pointer",
                fontWeight: "500",
                color: "black",
              }}
            >
              Today
            </button>

            {/* Native Date Picker stylized to match the image */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                border: "1px solid #E4E7EC",
                borderRadius: "8px",
                padding: "0 12px",
              }}
            >
              <input
                type="date"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  padding: "8px 0",
                  paddingRight: "5px",
                  outline: "none",
                  color: "#344054",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E4E7EC",
                backgroundColor: "white",
                cursor: "pointer",
                fontWeight: "500",
                color: "black",
              }}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* --- Second Row: Search Bar + Status Filters --- */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          {/* Search Bar Wrapper */}
          <div style={{ position: "relative", flex: 1, maxWidth: "1020px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "gray",
              }}
            />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              style={{
                width: "100%",
                padding: "10px 10px 10px 36px",
                borderRadius: "8px",
                border: "1px solid #E4E7EC",
                backgroundColor: "#F9FAFB",
                outline: "none",
                boxSizing: "border-box", // <-- ADD THIS LINE
              }}
            />
          </div>

          {/* Dynamic Status Filters */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["All", "Verified", "Not Verified"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #E4E7EC",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  // Dynamically change colors if this button is the active one
                  backgroundColor:
                    activeFilter === status ? "#0A0A0A" : "#FFFFFF",
                  color: activeFilter === status ? "#FFFFFF" : "#344054",
                }}
                Filter
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
                <th  style={{textAlign: "center"}}>Photo</th>
                <th  style={{textAlign: "center"}}>Timestamp</th>
                <th  style={{textAlign: "center"}}>Student ID</th>
                <th  style={{textAlign: "center"}}>Student Name</th>
                <th  style={{textAlign: "center"}}>Program & Year</th>
                <th  style={{textAlign: "center"}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td
                      style={{
                        color: "gray",
                        borderBottom: "2px solid #ECECF0",
                        paddingTop: "8px",
                        textAlign: "center"
                      }}
                    >
                      <img
                        src={getPhotoSrc(log.photo)}
                        alt={log.full_name || "Student"}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #E4E7EC",
                          background: "#F9FAFB",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                    </td>
                    <td style={{textAlign: "center" }}>{log.timestamp}</td>
                    <td style={{textAlign: "center" }}>{log.id_number}</td>
                    <td style={{textAlign: "center" }}>{log.full_name}</td>
                    <td style={{textAlign: "center" }}>
                      {log.program} {log.year_level}
                    </td>
                    <td
                      style={{
                        color: log.status === "VERIFIED" ? "green" : "red",
                        fontWeight: "600",
                        textAlign: "center"
                      }}
                    >
                      {log.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
