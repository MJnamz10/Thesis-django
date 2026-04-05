import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStudents from "../hooks/useStudents";
import "../css/managestudentrecords.css";
import "../css/dashboard.css";
import {
  UserPen,
  Plus,
  Download,
  GraduationCap,
  CalendarDays,
  UserCircle2,
  Eye,
  Search,
  Users,
  Hash,
  Trash2,
  Upload,
} from "lucide-react";
import AddStudentModal from "./AddStudentModal";
import Header from "./Header.jsx";

export default function ManageStudentRecords() {
  document.title = "Manage Student Records | Verifid";
  const navigate = useNavigate();
  const location = useLocation();

  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailStudent, setSelectedDetailStudent] = useState(null);

  const [scannerOnline, setScannerOnline] = useState(false); // State to track QR scanner status

  const { students, loading, refresh } = useStudents();
  // Security Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const fileInputRef = useRef(null);
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Package the file into a FormData object (required for sending files)
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 2. Send it to Django!
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/students/bulk-import/`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        if (data.errors && data.errors.length > 0) {
          // This will pop up the exact reasons why Django rejected the rows!
          alert(
            `${data.message}\n\nReasons for failure:\n${data.errors.slice(0, 5).join("\n")}`,
          );
          console.log("Full Error List:", data.errors);
        } else {
          alert(data.message);
        }
        refresh();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Network error while trying to import the file.");
    } finally {
      // 3. Clear the input so the user can import the same file again if needed
      e.target.value = null;
    }
  };

  // Updated helper function to generate initials
  const getFullImageUrl = (path, fullName) => {
    // 1. If they uploaded a real photo, always use it!
    if (path) {
      return path.startsWith("http")
        ? path
        : `${import.meta.env.VITE_API_BASE}${path}`;
    }

    // 2. If no photo, generate the initials!
    if (fullName) {
      // encodeURIComponent safely handles spaces (e.g., "Chris Abella" becomes "Chris%20Abella")
      // We are using your school's blue theme (#1c398e) for the background!
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1c398e&color=fff&size=128&bold=true`;
    }

    // 3. Absolute fallback just in case a record has no name and no photo
    return "/images/default-avatar.png";
  };

  // 👉 NEW: Triggers the download of the CSV file from Django
  const handleExportClick = async () => {
    try {
      // 1. Fetch the file from our new Django URL
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/students/export/csv/`,
        {
          method: "GET",
        },
      );

      if (!response.ok) throw new Error("Network response was not ok");

      // 2. Convert the response into a downloadable "Blob" (Binary Large Object)
      const blob = await response.blob();

      // 3. Create a temporary, invisible link in the browser to force the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "VerifID_Student_Records.csv"; // The name of the file

      // 4. Click the invisible link, then clean it up!
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export student records. Is the server running?");
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(query) ||
      student.id_number.toLowerCase().includes(query) ||
      student.program.toLowerCase().includes(query)
    );
  });

  // Opens the modal instead of the browser popup
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setAdminPassword(""); // Clear old passwords
    setDeleteError(""); // Clear old errors
    setDeleteModalOpen(true);
  };

  // The new function that actually talks to Django
  const executeSecureDelete = async () => {
    setDeleteError("");

    if (!adminPassword) {
      setDeleteError("Password is required.");
      return;
    }

    try {
      // 1. Verify the password with Django first!
      const verifyRes = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/verify-admin-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword }),
        },
      );

      if (!verifyRes.ok) {
        setDeleteError("Incorrect admin password. Deletion cancelled.");
        return;
      }

      // 2. If Django says the password is correct, delete the student!
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/students/${studentToDelete.id}/`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        refresh(); // Update the table
        setDeleteModalOpen(false); // Close the modal
        setStudentToDelete(null);
      } else {
        setDeleteError("Failed to delete the record. Please try again.");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      setDeleteError("Network error. Please check if the server is running.");
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/verifid/dashboard-data`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        // Use the same key 'scannerOnline' used in the Dashboard
        setScannerOnline(data.scannerOnline); 
      } catch (error) {
        console.error("Error fetching scanner status:", error);
        setScannerOnline(false);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <Header scannerOnline={scannerOnline} />
      <div className="page">
        <div className="container2MSR">
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
                <p> Manage Student Records</p>
              </div>
              <div className="txt2">
                <p> Create, update, and manage student information.</p>
              </div>
            </div>
            {/* 👉 2. Allows the buttons to stack neatly if the screen gets super tiny */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <button onClick={handleImportClick} className="export-button">
                <Upload size={16} /> Import
              </button>
              <button onClick={handleExportClick} className="export-button">
                <Download size={16} /> Export CSV
              </button>
              <button
                onClick={() => setOpenModal(true)}
                className="add-student-btn"
              >
                <Plus size={16} /> Add Student Record
              </button>
            </div>
          </div>

          <div style={{ display: "flex", marginBottom: "24px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "100%" }}>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid #E4E7EC",
                  backgroundColor: "#F9FAFB",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div className="table-containerMSR">
            <table className="tableMSR">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>ID Number</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Validity</th>
                  <th>QR Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id_number}>
                      <td>
                        <img
                          src={getFullImageUrl(
                            student.photo,
                            student.full_name,
                          )} // <-- Pass full_name here
                          alt={student.full_name}
                          className="student-photo-thumbnail"
                          // The UI Avatars API rarely fails, but we keep a safe fallback
                          onError={(e) => {
                            e.target.src = "/images/default-avatar.png";
                          }}
                        />
                      </td>
                      <td>{student.id_number}</td>
                      <td>{student.full_name}</td>
                      <td>{student.program}</td>
                      <td>{student.year_level}</td>
                      <td>
                        {student.gender || (
                          <span style={{ color: "gray" }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {student.age || (
                          <span style={{ color: "gray" }}>N/A</span>
                        )}
                      </td>
                      <td>{student.validity_status}</td>

                      <td>
                        {student.qr_code ? (
                          <img
                            src={getFullImageUrl(student.qr_code)}
                            width="40"
                            alt="Student QR"
                          />
                        ) : (
                          <span style={{ fontSize: "12px", color: "gray" }}>
                            No QR
                          </span>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                          }}
                        >
                          <Eye
                            size={18}
                            style={{ cursor: "pointer", color: "#fbb316" }}
                            title="View Details"
                            onClick={() => setSelectedDetailStudent(student)}
                          />
                          <UserPen
                            size={18}
                            style={{ cursor: "pointer", color: "#1c398e" }}
                            title="Edit Record"
                            onClick={() => handleEditClick(student)}
                          />
                          <Trash2
                            size={18}
                            style={{ cursor: "pointer", color: "#dc2626" }}
                            title="Delete Record"
                            onClick={() => handleDeleteClick(student)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {searchQuery
                        ? `No results found for "${searchQuery}"`
                        : "No student records available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AddStudentModal
          key={selectedStudent ? selectedStudent.id_number : "new-student"}
          open={openModal}
          onClose={handleCloseModal}
          refreshData={refresh}
          editData={selectedStudent}
        />

        {selectedDetailStudent && (
          <div
            onClick={() => setSelectedDetailStudent(null)}
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
                  <h2
                    style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}
                  >
                    Student Details
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "gray",
                      margin: "4px 0 0 0",
                    }}
                  >
                    Complete student information
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
                  onClick={() => setSelectedDetailStudent(null)}
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
                  src={getFullImageUrl(
                    selectedDetailStudent.photo,
                    selectedDetailStudent.full_name,
                  )}
                  alt={selectedDetailStudent.full_name}
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
                <h3
                  style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}
                >
                  {selectedDetailStudent.full_name}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "gray",
                    margin: "8px 0 16px 0",
                  }}
                >
                  {selectedDetailStudent.id_number}
                </p>

                <div
                  style={{
                    backgroundColor:
                      selectedDetailStudent.validity_status === "VERIFIED"
                        ? "#EBF8F2"
                        : selectedDetailStudent.validity_status === "INVALID"
                          ? "#FEEDEA"
                          : "#F2F4F7",
                    color:
                      selectedDetailStudent.validity_status === "VERIFIED"
                        ? "#1B9B62"
                        : selectedDetailStudent.validity_status === "INVALID"
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
                  {selectedDetailStudent.validity_status.replace("_", " ")}
                </div>
              </div>

              <div
                style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }}
              />

              {/* --- UPDATED: Perfect 2x2 Grid for Student Info --- */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr" /* This creates two equal-width columns */,
                  gap: "24px 16px" /* 24px vertical gap, 16px horizontal gap */,
                  marginBottom: "20px",
                  width: "100%",
                  padding: "0 16px",
                  boxSizing: "border-box",
                }}
              >
                {/* 1. Program (Top Left) */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ color: "#155DFC" }}>
                    <GraduationCap size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>
                      Program
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#101828",
                      }}
                    >
                      {selectedDetailStudent.program}
                    </span>
                  </div>
                </div>

                {/* 2. Year Level (Top Right) */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ color: "#155DFC" }}>
                    <CalendarDays size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>
                      Year Level
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#101828",
                      }}
                    >
                      {{
                        1: "1st Year",
                        2: "2nd Year",
                        3: "3rd Year",
                        4: "4th Year",
                        5: "5th Year",
                      }[selectedDetailStudent.year_level] ||
                        selectedDetailStudent.year_level}
                    </span>
                  </div>
                </div>

                {/* 3. Gender (Bottom Left) */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ color: "#155DFC" }}>
                    <Users size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>
                      Gender
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#101828",
                      }}
                    >
                      {selectedDetailStudent.gender || "N/A"}
                    </span>
                  </div>
                </div>

                {/* 4. Age (Bottom Right) */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ color: "#155DFC" }}>
                    <Hash size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "gray" }}>Age</span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#101828",
                      }}
                    >
                      {selectedDetailStudent.age || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src={getFullImageUrl(selectedDetailStudent.qr_code)}
                  alt="Zoomed Student QR"
                  style={{
                    width: "200px",
                    height: "200px",
                    marginBottom: "20px",
                    objectFit: "contain",
                  }}
                />
              </div>

              <button
                className="close-btn"
                onClick={() => setSelectedDetailStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* --- SECURE DELETE MODAL --- */}
        {deleteModalOpen && (
          <div
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
            }}
          >
            <div
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                width: "400px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    padding: "10px",
                    borderRadius: "50%",
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={24} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      margin: 0,
                      color: "#111827",
                    }}
                  >
                    Confirm Deletion
                  </h2>
                </div>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to permanently delete the record for{" "}
                <strong>{studentToDelete?.full_name}</strong>? Please enter your
                admin password to confirm.
              </p>

              {deleteError && (
                <div
                  style={{
                    color: "#dc2626",
                    backgroundColor: "#fef2f2",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    border: "1px solid #fecaca",
                  }}
                >
                  {deleteError}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    color: "#374151",
                  }}
                >
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    color: "#374151",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeSecureDelete}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "white",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
