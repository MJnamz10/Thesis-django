import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/accesslogs.css";
// Added Calendar, Download, and Search icons from lucide-react
import { UserPen, Calendar, Download, Search } from "lucide-react";
import Header from "./Header.jsx";
import "../css/dashboard.css";

export default function AccessLogs() {
  document.title = "Access Logs | Verifid";
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const [scannerOnline, setScannerOnline] = useState(false); // State to track QR scanner status

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const getPhotoSrc = (photo) => {
    if (!photo) return "/images/default-avatar.png";
    if (photo.startsWith("http")) return photo;
    return `${API_BASE}${photo}`;
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
      fetchScannerStatus(); // Regularly update scanner status every 3 seconds
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

      // Status filter
      const matchesStatus =
        activeFilter === "All"
          ? true
          : activeFilter === "Verified"
            ? !isMissing && log.status === "VERIFIED"
            : activeFilter === "Not Verified"
              ? isMissing || log.status !== "VERIFIED"
              : true;

      // Search filter
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

      // Date filter
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
      <Header scannerOnline={scannerOnline}/>
      <div className="page">
        {/* Main Content Area */}
        <div className="container2AL">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
              flexWrap:
                "wrap" /* 👉 Lets the export buttons drop down if squeezed */,
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
                <button
                  className="date-clear-btn"
                  onClick={clearDateFilter}
                >
                  Clear
                </button>
              )}
            </div>

            <button
                className="export-btn"
                onClick={exportToCSV}
              >
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
                      colSpan="6"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isMissing = isMissingRecord(log);

                    return (
                      <tr key={log.id}>
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
                                  ? "#22c55e" // green
                                  : log.status === "NOT VERIFIED"
                                    ? "#ef4444"// red for not verified
                                    : "#000000" , // black for invalid, not in masterlist, or missing data
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
      </div>
    </>
  );
}
