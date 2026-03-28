import React, { useState } from "react";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStudents from "../hooks/useStudents";
import "../css/managestudentrecords.css";
import { UserPen, Plus, Download, GraduationCap, CalendarDays, UserCircle2, Eye, Search} from "lucide-react";
import AddStudentModal from "./AddStudentModal"; 
import { UserPen, Plus, Download, GraduationCap, CalendarDays, UserCircle2, Eye, Search} from "lucide-react";
import AddStudentModal from "./AddStudentModal"; 

export default function ManageStudentRecords() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ALL STATE HOOKS MUST BE AT THE TOP LEVEL
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailStudent, setSelectedDetailStudent] = useState(null); // ✅ Moved up here safely!

  const { students, loading, refresh } = useStudents();

  // Helper function to handle image paths securely
  const getFullImageUrl = (path) => {
    if (!path) return "/images/default-avatar.png"; 
    return path.startsWith('http') ? path : `http://127.0.0.1:8000${path}`;
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

  return (
    <div>
      <img src="/images/logo.png" alt="logo" className="logo" />
      <h1 className="school">
        University of Science and Technology of Southern Philippines
      </h1>
      <div className="container1">
        <div className={location.pathname === "/" ? "active-item" : "item"} onClick={() => navigate("/")}>
          <img src="/images/Icon.png" className="icon1" alt="icon" /> Dashboard
        </div>
        <div className={location.pathname === "/accesslogs" ? "active-item" : "item"} onClick={() => navigate("/accesslogs")}>
          <img src="/images/Icon (2).png" className="icon3" alt="icon" /> Access Logs
        </div>
        <div className={location.pathname === "/managestudentrecords" ? "active-item" : "item"} onClick={() => navigate("/managestudentrecords")}>
          <UserPen className="icon2" alt="icon" /> Manage Student Records
        </div>
      </div>
      
<div className="container2">
        {/* --- Top Header Row --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0a0a0a' }}>Manage Student Records</div>
            <div style={{ margin: '4px 0 0 0', color: 'gray', fontSize: '14px' }}>Create, update, and manage student information.</div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="export-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E4E7EC', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500', color: '#1c398e' }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setOpenModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1c398e', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
              <Plus size={16} /> Add Student Record
            </button>
          </div>
        </div>

        {/* --- Search Bar Row --- */}
        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E4E7EC', backgroundColor: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
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
                <tr><td colSpan="8" style={{ textAlign: "center" }}>Loading...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id_number}>
                    <td>
                      <img
                        src={getFullImageUrl(student.photo)}
                        alt={student.full_name}
                        className="student-photo-thumbnail"
                        onError={(e) => { e.target.src = "/images/default-avatar.png"; }}
                      />
                    </td>
                    <td>{student.id_number}</td>
                    <td>{student.full_name}</td>
                    <td>{student.program}</td>
                    <td>{student.year_level}</td>
                    <td>{student.validity_status}</td>
                    
                    {/* ✅ UPDATED CLICKABLE QR CODE TD */}
<td>
  {student.qr_code ? (
    <img 
      src={getFullImageUrl(student.qr_code)} 
      width="40" 
      alt="Student QR" 
    />
  ) : (
    <span style={{ fontSize: "12px", color: "gray" }}>No QR</span>
  )}
</td>

  <td>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <Eye 
      size={18} 
      style={{ cursor: "pointer", color: "#475467" }} 
      title="View Details"
      onClick={() => setSelectedDetailStudent(student)} 
    />
    <UserPen 
      size={18} 
      style={{ cursor: "pointer", color: "#475467" }} 
      title="Edit Record"
      onClick={() => handleEditClick(student)} 
    />
  </div>
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    {searchQuery ? `No results found for "${searchQuery}"` : "No student records available."}
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

      {/* ✅ ADDED THE COMPREHENSIVE MODAL OVERLAY */}
      {selectedDetailStudent && (
        <div 
          onClick={() => setSelectedDetailStudent(null)} 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)", display: "flex",
            justifyContent: "center", alignItems: "center",
            zIndex: 9999, cursor: "zoom-out",
          }}
        >
          <div 
            style={{ 
              background: "white", padding: "24px", borderRadius: "16px",
              width: "480px", display: "flex", flexDirection: "column", cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Student Details</h2>
                    <p style={{ fontSize: '14px', color: 'gray', margin: '4px 0 0 0' }}>Complete student information</p>
                </div>
                <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'gray' }} onClick={() => setSelectedDetailStudent(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#101828' }}>
                <img 
                  src={getFullImageUrl(selectedDetailStudent.photo)} 
                  alt={selectedDetailStudent.full_name} 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px' }} 
                  onError={(e) => { e.target.src = "/images/default-avatar.png"; }}
                />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{selectedDetailStudent.full_name}</h3>
                <p style={{ fontSize: '14px', color: 'gray', margin: '8px 0 16px 0' }}>{selectedDetailStudent.id_number}</p>
                
                <div style={{ 
                    backgroundColor: selectedDetailStudent.validity_status === 'VERIFIED' ? '#EBF8F2' : selectedDetailStudent.validity_status === 'INVALID' ? '#FEEDEA' : '#F2F4F7',
                    color: selectedDetailStudent.validity_status === 'VERIFIED' ? '#1B9B62' : selectedDetailStudent.validity_status === 'INVALID' ? '#CB2B21' : '#616161',
                    padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px', textTransform: 'capitalize'
                }}>
                    {selectedDetailStudent.validity_status.replace('_', ' ')}
                </div>
            </div>

            <div style={{ borderTop: '1px solid #E4E7EC', marginBottom: '20px' ,}} />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '80px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#155DFC'}}><GraduationCap size={20} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'gray' }}>Program</span>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#101828'}}>{selectedDetailStudent.program}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#155DFC'}}><CalendarDays size={20} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'gray' }}>Year Level</span>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#101828'}}>
                          {{ "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year", "5": "5th Year" }[selectedDetailStudent.year_level] || selectedDetailStudent.year_level}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#155DFC'}}><UserCircle2 size={20} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'gray' }}>Student ID</span>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#101828'}}>{selectedDetailStudent.id_number}</span>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #E4E7EC', marginBottom: '20px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <img 
                  src={getFullImageUrl(selectedDetailStudent.qr_code)} 
                  alt="Zoomed Student QR" 
                  style={{ width: "200px", height: "200px", marginBottom: '20px', objectFit: 'contain' }} 
                />
            </div>

            <button 
              style={{ width: "100%", background: '#101828', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setSelectedDetailStudent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}