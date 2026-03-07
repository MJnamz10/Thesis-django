import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStudents from "../hooks/useStudents";
import "../css/managestudentrecords.css";
import { UserPen, Plus } from "lucide-react";
import { useState } from "react";
import AddStudentModal from "./AddStudentModal"; // adjust path if needed
import { Download } from "lucide-react";

export default function ManageStudentRecords() {
  const navigate = useNavigate();

  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  

  const [searchQuery, setSearchQuery] = useState("");

  const { students, loading, refresh } = useStudents();

  const handleEditClick = (student) => {
    setSelectedStudent(student); // Set the student data
    setOpenModal(true); // Open the modal
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStudent(null); // Reset when closing
  };

  // 2. Logic to filter students based on ID or Name
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(query) ||
      student.id_number.toLowerCase().includes(query) ||
      student.program.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <img src="/images/logo.png" alt="logo" className="logo" />
      <h1 className="school">
        University of Science and Technology of Southern Philippines
      </h1>
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
      <div className="container2">
        <div className="text1">
          <p>Manage Student Records</p>
        </div>
        <div className="text2">
          <p>Create, update, and manage student information.</p>
        </div>
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <img
          src="/images/search-icon.png"
          className="search-icon"
          alt="search"
        />
        <div className="buttons">
          <button className="select-button1" onClick={() => setOpenModal(true)}>
            <Plus className="icon6" /> Add Student Record
          </button>{" "}
        </div>
        <div className="buttons1">
          <button className="export-button">
            <Download className="icon6" /> Export CSV
          </button>{" "}
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID Number</th>
                <th>Name</th>
                <th>Program</th>
                <th>Year</th>
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
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.full_name}
                          className="student-photo-thumbnail"
                          onError={(e) => {
                            e.target.src = "/images/default-avatar.png";
                          }}
                        />
                      ) : (
                        <div className="photo-placeholder">No Image</div>
                      )}
                    </td>
                    <td>{student.id_number}</td>
                    <td>{student.full_name}</td>
                    <td>{student.program}</td>
                    <td>{student.year_level}</td>
                    <td>{student.validity_status}</td>
                    <td>
                      <img src="/images/qr-sample.png" width="24" alt="qr" />
                    </td>
                    <td>
                      <UserPen
                        size={18}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditClick(student)}
                      />
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
        /* Adding a 'key' ensures that React treats each edit/add session 
     as a fresh component. This prevents the "synchronous setState" 
     warning and ensures the form is always clean.
  */
        key={selectedStudent ? selectedStudent.id_number : "new-student"}
        open={openModal}
        onClose={handleCloseModal}
        refreshData={refresh}
        editData={selectedStudent}
      />
    </div>
  );
}
