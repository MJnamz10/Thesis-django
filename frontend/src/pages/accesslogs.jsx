import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/accesslogs.css";
import { UserPen, Calendar, Download, Search, GraduationCap, CalendarDays, Users, Hash } from "lucide-react";
import Header from "./Header.jsx";
import "../css/dashboard.css";
// 👉 NEW: Import the students hook
import useStudents from "../hooks/useStudents"; 

export default function AccessLogs() {
  document.title = "Access Logs | Verifid";
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const [scannerOnline, setScannerOnline] = useState(false);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 NEW: Bring in the live masterlist database
  const { students } = useStudents();

  // Filters
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  const [selectedDetailLog, setSelectedDetailLog] = useState(null);

  const getFullImageUrl = (path, fullName) => {
    if (path) {
      return path.startsWith("http") ? path : `${API_BASE}${path}`;
    }
    if (fullName && fullName !== "Not in Masterlist") {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1c398e&color=fff&size=128&bold=true`;
    }
    return "/images/default-avatar.png";
  };

  const isMissingRecord = (log) => {
    return (
      !log.id_number ||
      log.id_number === "Not in Masterlist" ||
      log.full_name === "Not in Masterlist" ||
      !log.full_name
    );
  };

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLogDateInManila = (log) => {
    const rawDate = log.created_at || log.timestamp;
    if (!rawDate) return "";

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) return "";

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(date); // YYYY-MM-DD
  };

  useEffect(() => {
    fetchLogs(true);
    fetchScannerStatus();

    const interval = setInterval(() => {
      fetchLogs(false);
      fetchScannerStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchScannerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/verifid/dashboard-data`);
      const data = await response.json();
      setScannerOnline(data.scannerOnline);
    } catch (error) {
      console.error("Error fetching scanner status:", error);
      setScannerOnline(false);
    }
  };

  const fetchLogs = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(`${API_BASE}/api/verifid/all-logs`);
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();

      setLogs((prev) =>
        JSON.stringify(prev) === JSON.stringify(data) ? prev : data,
      );
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const isMissing = isMissingRecord(log);

      const matchesStatus =
        activeFilter === "All"
          ? true
          : activeFilter === "Verified"
            ? !isMissing && log.status === "VERIFIED"
            : activeFilter === "Not Verified"
              ? isMissing || log.status !== "VERIFIED"
              : true;

      const studentName = (log.full_name || "").toLowerCase();
      const studentId = String(log.id_number || "").toLowerCase();
      const studentProgram = String(
        log.program || log.year_level,
      ).toLowerCase();
      const programYear =
        `${log.program || ""} ${log.year_level || ""}`.toLowerCase();
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        studentName.includes(search) ||
        studentId.includes(search) ||
        studentProgram.includes(search) ||
        programYear.includes(search);

      const logDate = getLogDateInManila(log);
      const matchesDate = !selectedDate || logDate === selectedDate;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [logs, activeFilter, searchTerm, selectedDate]);

  const handleTodayFilter = () => {
    const today = formatDateInput(new Date());
    setSelectedDate(today);
  };

  const clearDateFilter = () => {
    setSelectedDate("");
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const headers = [
      "Timestamp",
      "Student ID",
      "Student Name",
      "Program & Year",
      "Status",
    ];

    const rows = filteredLogs.map((log) => {
      const isMissing = isMissingRecord(log);

      const timestamp = log.created_at
        ? new Date(log.created_at).toLocaleString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila",
          })
        : log.timestamp || "";

      return [
        timestamp,
        isMissing ? "N/A" : log.id_number || "",
        isMissing ? "N/A" : log.full_name || "",
        isMissing
          ? "N/A"
          : `${log.program || ""} ${log.year_level || ""}`.trim(),
        isMissing ? "INVALID" : log.status || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "access_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header scannerOnline={scannerOnline} />
      <div className="page">
        <div className="container2AL">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div className="dash-header">
              <div className="txt1">
                <p>Access Logs</p>
              </div>
              <div className="txt2">
                <p>Complete history of all access attempts</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                className={`today-btn ${selectedDate === formatDateInput(new Date()) ? "is-selected" : ""}`}
                onClick={handleTodayFilter}
              >
                Today
              </button>

              <div className="date-filter-container">
                <input
                  type="date"
                  className="date-filter-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <button className="date-clear-btn" onClick={clearDateFilter}>
                    Clear
                  </button>
                )}
              </div>

              <button className="export-btn" onClick={exportToCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or student ID..."
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid #E4E7EC",
                  backgroundColor: "#F9FAFB",
                  color: "black",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

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
                    backgroundColor:
                      activeFilter === status ? "#0f0e54" : "#FFFFFF",
                    color: activeFilter === status ? "#FFFFFF" : "#344054",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="table-containerAL">
            <table
              className="tableAL"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>Photo</th>
                  <th style={{ textAlign: "center" }}>Timestamp</th>
                  <th style={{ textAlign: "center" }}>Student ID</th>
                  <th style={{ textAlign: "center" }}>Student Name</th>
                  <th style={{ textAlign: "center" }}>Program & Year</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isMissing = isMissingRecord(log);

                    return (
                      <tr 
                        key={log.id}
className={isMissing ? "" : "clickable-row"}                        onClick={() => {
                          if (!isMissing) {
                            // Find the live student in the master list
                            const liveStudentData = students.find(
                              (s) => s.id_number === log.id_number
                            );

                            if (liveStudentData) {
                              // Merge log data with live data. We force log.status to persist.
                              setSelectedDetailLog({
                                ...log, 
                                ...liveStudentData,
                                status: log.status,
                                created_at: log.created_at
                              });
                            } else {
                              // Fallback to purely log data if they aren't in the live DB anymore
                              setSelectedDetailLog(log);
                            }
                          }
                        }}
                        style={{ cursor: isMissing ? "default" : "pointer" }}
                      >
                        <td
                          style={{
                            borderBottom: "2px solid #ECECF0",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            {isMissing ? (
                              <div
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  borderRadius: "8px",
                                  border: "1px dashed #ef4444",
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
                                    color: "#ef4444",
                                    textTransform: "uppercase",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  No Student <br /> Record
                                </span>
                              </div>
                            ) : (
                              <img
                                src={getFullImageUrl(log.photo, log.full_name)}
                                alt={log.full_name || "Student"}
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
                          </div>
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString("en-PH", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "numeric",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Manila",
                              })
                            : log.timestamp}
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {isMissing ? "N/A" : log.id_number}
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {isMissing ? "N/A" : log.full_name}
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            borderBottom: "2px solid #ECECF0",
                          }}
                        >
                          {isMissing
                            ? "N/A"
                            : `${log.program} ${log.year_level}`}
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
                                !isMissing && log.status === "VERIFIED"
                                  ? "#22c55e"
                                  : log.status === "NOT VERIFIED"
                                    ? "#ef4444"
                                    : "#000000",
                            }}
                          >
                            {isMissing ? "INVALID" : log.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedDetailLog && (
          <div
            onClick={() => setSelectedDetailLog(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              cursor: "zoom-out",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                width: "480px",
                display: "flex",
                flexDirection: "column",
                cursor: "default",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
                    Student Details
                  </h2>
                  <p style={{ fontSize: "14px", color: "gray", margin: "4px 0 0 0" }}>
                    Information from Access Log
                  </p>
                </div>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "gray",
                  }}
                  onClick={() => setSelectedDetailLog(null)}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#101828",
                }}
              >
                <img
                  src={getFullImageUrl(selectedDetailLog.photo, selectedDetailLog.full_name)}
                  alt={selectedDetailLog.full_name}
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "16px",
                  }}
                  onError={(e) => {
                    e.target.src = "/images/default-avatar.png";
                  }}
                />
                <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
                  {selectedDetailLog.full_name}
                </h3>
                <p style={{ fontSize: "14px", color: "gray", margin: "8px 0 16px 0" }}>
                  {selectedDetailLog.id_number}
                </p>

                <div
                  style={{
                    backgroundColor:
                      selectedDetailLog.status === "VERIFIED"
                        ? "#EBF8F2"
                        : selectedDetailLog.status === "INVALID"
                          ? "#FEEDEA"
                          : "#F2F4F7",
                    color:
                      selectedDetailLog.status === "VERIFIED"
                        ? "#1B9B62"
                        : selectedDetailLog.status === "INVALID"
                          ? "#CB2B21"
                          : "#616161",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "20px",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedDetailLog.status ? selectedDetailLog.status.replace("_", " ") : "UNKNOWN"}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px 16px",
                  marginBottom: "20px",
                  width: "100%",
                  padding: "0 16px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#155DFC" }}>
                    <GraduationCap size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>Program</span>
                    <span style={{ fontSize: "16px", fontWeight: "500", color: "#101828" }}>
                      {selectedDetailLog.program || "N/A"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#155DFC" }}>
                    <CalendarDays size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>Year Level</span>
                    <span style={{ fontSize: "16px", fontWeight: "500", color: "#101828" }}>
                      {{
                        1: "1st Year",
                        2: "2nd Year",
                        3: "3rd Year",
                        4: "4th Year",
                        5: "5th Year",
                      }[selectedDetailLog.year_level] || selectedDetailLog.year_level || "N/A"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#155DFC" }}>
                    <Users size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>Gender</span>
                    <span style={{ fontSize: "16px", fontWeight: "500", color: "#101828" }}>
                      {selectedDetailLog.gender || "N/A"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#155DFC" }}>
                    <Hash size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>Age</span>
                    <span style={{ fontSize: "16px", fontWeight: "500", color: "#101828" }}>
                      {selectedDetailLog.age || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }} />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {selectedDetailLog.qr_code ? (
                  <img
                    src={getFullImageUrl(selectedDetailLog.qr_code)}
                    alt="Zoomed Student QR"
                    style={{
                      width: "200px",
                      height: "200px",
                      marginBottom: "20px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "14px", color: "gray", marginBottom: "20px" }}>
                    No QR Code Available
                  </span>
                )}
              </div>

              <button className="close-btn" onClick={() => setSelectedDetailLog(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}