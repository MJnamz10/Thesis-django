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
  MoreVertical,
  RefreshCw,     // 👈 Added
  AlertOctagon,  // 👈 Added
  Printer,       // 👈 Added
  FileDown       // 👈 Added
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // 👈 Changed this line
import AddStudentModal from "./AddStudentModal";
import Header from "./Header.jsx";

export default function ManageStudentRecords() {
  document.title = "Manage Student Records | Verifid";
  const navigate = useNavigate();
  const location = useLocation();

  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  //Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selectedDetailStudent, setSelectedDetailStudent] = useState(null);

  const [scannerOnline, setScannerOnline] = useState(false); // State to track QR scanner status

  const [menuOpen, setMenuOpen] = useState(false); // State for menu icon
  const menuRef = useRef(null); // Useful for closing when clicking outside

  // Modals for bulk actions
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false); // 👈 ADD THIS
  
  // For the targeted delete (checkboxes)
  const [selectedIds, setSelectedIds] = useState([]);

  const { students, loading, refresh } = useStudents();
  
  // Scans your database and grabs all unique program names dynamically
  const uniquePrograms = Array.from(new Set(students.map(s => s.program)))
    .filter(Boolean) // Removes any empty/null values
    .sort(); // Puts them in alphabetical order


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

  const filteredStudents = students
    .filter((student) => {
      // 1. Search Bar Match
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        student.full_name.toLowerCase().includes(query) ||
        student.id_number.toLowerCase().includes(query) ||
        student.program.toLowerCase().includes(query)
      );

      // 2. Dropdown Matches (If a dropdown is empty "", it passes automatically)
      // We wrap year_level in String() just in case it came from Django as an integer
      const matchesYear = filterYear ? String(student.year_level) === filterYear : true;
      const matchesProgram = filterProgram ? student.program === filterProgram : true;
      const matchesStatus = filterStatus ? student.validity_status === filterStatus : true;

      // 3. ONLY return the student if they match ALL active filters
      return matchesSearch && matchesYear && matchesProgram && matchesStatus;
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

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

// 1. SECURE: Reset Validity (New Semester)
  const executeResetValidity = async () => {
    setDeleteError("");
    if (!adminPassword) return setDeleteError("Password is required.");

    try {
      // Verify password first
      const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/verify-admin-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!verifyRes.ok) return setDeleteError("Incorrect admin password.");

      // If correct, proceed with reset
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/students/bulk-reset/`, {
        method: "POST",
      });
      if (response.ok) {
        alert("All student validities have been reset to NOT VERIFIED.");
        setResetModalOpen(false);
        setAdminPassword("");
        refresh();
      } else {
        setDeleteError("Failed to reset validities.");
      }
    } catch (error) {
      console.error("Error:", error);
      setDeleteError("Network error.");
    }
  };

  // 2. SECURE: Targeted Delete (Selected Items)
  const executeDeleteSelected = async () => {
    setDeleteError("");
    if (!adminPassword) return setDeleteError("Password is required.");

    try {
      // Verify password first
      const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/verify-admin-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!verifyRes.ok) return setDeleteError("Incorrect admin password.");

      // If correct, proceed with bulk delete
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/students/bulk-delete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      
      if (response.ok) {
        setDeleteSelectedModalOpen(false);
        setSelectedIds([]); // Clear checkboxes
        setAdminPassword("");
        refresh();
      } else {
        setDeleteError("Failed to delete selected students.");
      }
    } catch (error) {
      console.error("Error:", error);
      setDeleteError("Network error.");
    }
  };

  // 3. [Danger] Delete All 
  const executeDeleteAll = async () => {
    setDeleteError("");
    if (!adminPassword) return setDeleteError("Password is required.");

    try {
      // Verify password first
      const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/verify-admin-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!verifyRes.ok) return setDeleteError("Incorrect admin password.");

      // If correct, wipe the database
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/students/delete-all/`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteAllModalOpen(false);
        setAdminPassword("");
        refresh();
      } else {
        setDeleteError("Failed to wipe database.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

// 4. Print (PDF) - Formatted Table
  const handlePrint = () => {
    try {
      // 1. Create a new PDF document
      const doc = new jsPDF();

      // 2. Add a Title to the PDF
      doc.text("VerifID - Student Records", 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // 3. Define the exact columns you requested
      const tableColumns = ["ID Number", "Name", "Program", "Year", "Gender", "Age", "Validity"];

      // 4. Map over the currently filtered students to get their data securely
      const tableRows = [];
      filteredStudents.forEach((student) => {
        const studentData = [
          student.id_number || "N/A",
          student.full_name || "N/A",
          student.program || "N/A",
          student.year_level || "N/A",
          student.gender || "N/A",
          student.age || "N/A",
          student.validity_status ? student.validity_status.replace("_", " ") : "N/A"
        ];
        tableRows.push(studentData);
      });

      // 5. Generate the table inside the PDF (Using the standalone syntax!)
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 28, 
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [28, 57, 142] }, // Your school's blue!
      });

      // 6. Automatically download the file
      doc.save("VerifID_Student_Records.pdf");

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please check the console.");
    }
  };

  // 5. Download CSV Template (No backend needed!)
  const handleDownloadTemplate = () => {
    // Exact headers your Django import expects
    const csvContent = "id_number,full_name,program,year_level,gender,age,validity_status\n"; 
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "VerifID_Import_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

// Handle "Select All" checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // 👉 Changed to student.id_number
      const allIds = filteredStudents.map((student) => student.id_number);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]); // Deselect all
    }
  };

  // Handle individual row checkbox
  const handleSelectOne = (e, studentIdNumber) => {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, studentIdNumber]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== studentIdNumber));
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
              <div style={{ position: "relative" }} ref={menuRef}>
                {/* 1. The Icon Button (won't move when clicked) */}
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                  title="More options"
                >
                  <MoreVertical size={20} color="#030f28" />
                </button>

                {/* 2. The Dropdown Content */}
                {menuOpen && (
                  <div className="kebab-dropdown">
                    <button onClick={() => { 
                      setAdminPassword(""); 
                      setDeleteError(""); 
                      setResetModalOpen(true); 
                      setMenuOpen(false); 
                    }}>
                      <RefreshCw size={16} /> Reset Validity (New Semester)
                    </button>

                    <div className="dropdown-divider"></div>

                    <button 
                      onClick={() => { 
                        if (selectedIds.length === 0) return alert("No students selected!");
                        setAdminPassword(""); 
                        setDeleteError(""); 
                        setDeleteSelectedModalOpen(true); 
                        setMenuOpen(false); 
                      }}
                      style={{ opacity: selectedIds.length === 0 ? 0.5 : 1, cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer' }}
                      disabled={selectedIds.length === 0}
                    >
                      <Trash2 size={16} /> Delete Selected ({selectedIds.length})
                    </button>

                    <button className="delete-option" onClick={() => { setDeleteAllModalOpen(true); setMenuOpen(false); }}>
                      <AlertOctagon size={16} /> [ Danger ] Delete All
                    </button>

                    <div className="dropdown-divider"></div>

                    <button onClick={() => { handlePrint(); setMenuOpen(false); }}>
                      <Printer size={16} /> Print (PDF)
                    </button>

                    <button onClick={() => { handleDownloadTemplate(); setMenuOpen(false); }}>
                      <FileDown size={16} /> Download CSV Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- SEARCH & FILTER ROW --- */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            
            {/* 1. Search Bar */}
            <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "gray" }} />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: "1px solid #E4E7EC", backgroundColor: "#F9FAFB", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* 2. Program Filter (Dynamic) */}
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              style={{ 
                padding: "10px", 
                borderRadius: "8px", 
                // 👇 Dynamic Styling starts here!
                backgroundColor: filterProgram ? "#eff6ff" : "white", 
                border: filterProgram ? "1px solid #bfdbfe" : "1px solid #E4E7EC",
                color: filterProgram ? "#1e3a8a" : "#374151",
                outline: "none", 
                cursor: "pointer", 
                minWidth: "140px",
                fontWeight: filterProgram ? "500" : "normal"
              }}
            >
              <option value="">All Programs</option>
              {uniquePrograms.map((prog) => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>

            {/* 3. Year Level Filter */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ 
                padding: "10px", 
                borderRadius: "8px", 
                // 👇 Dynamic Styling starts here!
                backgroundColor: filterYear ? "#eff6ff" : "white", 
                border: filterYear ? "1px solid #bfdbfe" : "1px solid #E4E7EC",
                color: filterYear ? "#1e3a8a" : "#374151",
                outline: "none", 
                cursor: "pointer", 
                minWidth: "120px",
                fontWeight: filterYear ? "500" : "normal"
              }}
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>

            {/* 4. Validity Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                padding: "10px", 
                borderRadius: "8px", 
                // 👇 Dynamic Styling starts here!
                backgroundColor: filterStatus ? "#eff6ff" : "white", 
                border: filterStatus ? "1px solid #bfdbfe" : "1px solid #E4E7EC",
                color: filterStatus ? "#1e3a8a" : "#374151",
                outline: "none", 
                cursor: "pointer", 
                minWidth: "140px",
                fontWeight: filterStatus ? "500" : "normal"
              }}
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="NOT_VERIFIED">Not Verified</option>
              <option value="INVALID">Invalid</option>
            </select>

          </div>

          <div className="table-containerMSR">
            <table className="tableMSR">
              <thead>
                <tr>
                  {/* 👉 NEW: Master Checkbox */}
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      style={{ cursor: "pointer" }}
                      onChange={handleSelectAll}
                      checked={
                        filteredStudents.length > 0 &&
                        selectedIds.length === filteredStudents.length
                      }
                    />
                  </th>
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
                    <td colSpan="11" style={{ textAlign: "center" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    // 👉 Added a background color change if the row is selected!
                    <tr 
                      key={student.id_number}
                      style={{ backgroundColor: selectedIds.includes(student.id_number) ? "#dededf" : "transparent" }}
                    >
                      {/* 👉 NEW: Individual Checkbox */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          style={{ cursor: "pointer" }}
                          checked={selectedIds.includes(student.id_number)}
                          onChange={(e) => handleSelectOne(e, student.id_number)}
                        />
                      </td>

                      {/* Photo column stays exactly the same */}
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
                      colSpan="11"
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
              {/* --- HEADER --- */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>Student Details</h2>
                  <p style={{ fontSize: "13px", color: "gray", margin: "2px 0 0 0" }}>Complete student information</p>
                </div>
                <button style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "gray" }} onClick={() => setSelectedDetailStudent(null)}>✕</button>
              </div>

              <div style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }} />

              {/* --- TOP SECTION: PHOTO + NAME/ID/STATUS --- */}
              <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
                <img
                  src={getFullImageUrl(selectedDetailStudent.photo, selectedDetailStudent.full_name)}
                  alt={selectedDetailStudent.full_name}
                  style={{ width: "110px", height: "110px", borderRadius: "12px", objectFit: "cover", border: "1px solid #E4E7EC" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#101828", textTransform: "uppercase" }}>
                    {selectedDetailStudent.full_name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#667085", margin: 0 }}>{selectedDetailStudent.id_number}</p>
                  <div
                    style={{
                      marginTop: "8px",
                      backgroundColor: selectedDetailStudent.validity_status === "VERIFIED" ? "#EBF8F2" : selectedDetailStudent.validity_status === "INVALID" ? "#FEEDEA" : "#F2F4F7",
                      color: selectedDetailStudent.validity_status === "VERIFIED" ? "#1B9B62" : selectedDetailStudent.validity_status === "INVALID" ? "#CB2B21" : "#616161",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "12px",
                      width: "fit-content",
                      textAlign: "center"
                    }}
                  >
                    {selectedDetailStudent.validity_status.replace("_", " ")}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }} />

              {/* --- GRID SECTION: PROGRAM, YEAR, GENDER, AGE --- */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                {/* Program */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <GraduationCap size={18} color="#155DFC" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "gray" }}>Program</span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{selectedDetailStudent.program}</span>
                  </div>
                </div>
                {/* Year Level */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CalendarDays size={18} color="#155DFC" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "gray" }}>Year Level</span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{selectedDetailStudent.year_level}</span>
                  </div>
                </div>
                {/* Gender */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={18} color="#155DFC" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "gray" }}>Gender</span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{selectedDetailStudent.gender || "N/A"}</span>
                  </div>
                </div>
                {/* Age */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Hash size={18} color="#155DFC" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "gray" }}>Age</span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{selectedDetailStudent.age || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E4E7EC", marginBottom: "20px" }} />

              {/* --- QR CODE --- */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <img
                  src={getFullImageUrl(selectedDetailStudent.qr_code)}
                  alt="QR Code"
                  style={{ width: "150px", height: "150px", objectFit: "contain" }}
                />
              </div>

              {/* --- CLOSE BUTTON --- */}
              <button
                className="close-btn"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", fontWeight: "bold" }}
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
        {/* --- SECURE RESET VALIDITY MODAL --- */}
        {resetModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", width: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "#EBF8F2", padding: "10px", borderRadius: "50%", color: "#1B9B62" }}><RefreshCw size={24} /></div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#111827" }}>Reset Semester Validity</h2>
              </div>
              
              <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "20px", lineHeight: "1.5" }}>
                Are you sure you want to reset all student records to <strong>NOT VERIFIED</strong>? Enter your Admin Password to confirm.
              </p>

              {deleteError && (
                <div style={{ color: "#dc2626", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid #fecaca" }}>
                  {deleteError}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Admin Password</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  placeholder="Enter password" 
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setResetModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
                <button onClick={executeResetValidity} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#1B9B62", color: "white", fontWeight: "bold", cursor: "pointer" }}>Reset All</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SECURE DELETE SELECTED MODAL --- */}
        {deleteSelectedModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", width: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "50%", color: "#dc2626" }}><Trash2 size={24} /></div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#111827" }}>Delete Selected</h2>
              </div>
              
              <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "20px", lineHeight: "1.5" }}>
                Are you sure you want to permanently delete the <strong>{selectedIds.length}</strong> selected students? Enter your Admin Password to confirm.
              </p>

              {deleteError && (
                <div style={{ color: "#dc2626", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid #fecaca" }}>
                  {deleteError}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Admin Password</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  placeholder="Enter password" 
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setDeleteSelectedModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
                <button onClick={executeDeleteSelected} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Delete Students</button>
              </div>
            </div>
          </div>
        )}

        {/* --- DANGER: DELETE ALL MODAL --- */}
        {deleteAllModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", width: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "50%", color: "#dc2626" }}><AlertOctagon size={24} /></div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#111827" }}>WIPE DATABASE</h2>
              </div>
              
              <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "20px", lineHeight: "1.5" }}>
                <strong>WARNING:</strong> This action will permanently delete every student record in the system. This cannot be undone. Enter your Admin Password to confirm.
              </p>

              {deleteError && (
                <div style={{ color: "#dc2626", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid #fecaca" }}>
                  {deleteError}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Admin Password</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  placeholder="Enter password" 
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setDeleteAllModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
                <button onClick={executeDeleteAll} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Wipe Database</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
