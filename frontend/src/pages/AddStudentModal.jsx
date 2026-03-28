import { useEffect, useRef, useState } from "react";
import "../css/modal.css";

export default function AddStudentModal({
  open,
  onClose,
  refreshData,
  editData,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const dialogRef = useRef(null);

  // 1. UPDATED: Added gender and age to initial state
  const [formData, setFormData] = useState({
    id_number: editData?.id_number || "",
    full_name: editData?.full_name || "",
    program: editData?.program || "",
    year_level: editData?.year_level || "",
    gender: editData?.gender || "", 
    age: editData?.age || "",       
    validity_status: editData?.validity_status || "NOT_VERIFIED",
  });

  const [previewUrl, setPreviewUrl] = useState(editData?.photo || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 2. UPDATED: Append the new fields to the data being sent to Django
  const handleSave = async () => {
    const data = new FormData();
    data.append("id_number", formData.id_number);
    data.append("full_name", formData.full_name);
    data.append("program", formData.program);
    data.append("year_level", formData.year_level);
    data.append("gender", formData.gender); // NEW
    data.append("age", formData.age);       // NEW
    data.append("validity_status", formData.validity_status);

    if (selectedFile) {
      data.append("photo", selectedFile);
    }

    try {
      const url = editData
        ? `http://127.0.0.1:8000/api/students/${editData.id}/`
        : "http://127.0.0.1:8000/api/students/";

      const method = editData ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: data,
      });

      if (response.ok) {
        alert(
          editData
            ? "Student updated successfully!"
            : "Student added successfully!",
        );
        refreshData();
        onClose();
      } else {
        const result = await response.json();
        alert("Error: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Network error. Please check if the server is running.");
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="overlay" onMouseDown={onOverlayMouseDown}>
      <div className="modal" ref={dialogRef} role="dialog" aria-modal="true">
        <div className="modalHeader">
          <div>
            <h2 className="title">Add Student Record</h2>
            <p className="subtitle">
              Fill in the information below to add a new student to the records
              system.
            </p>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <label className="label">Student Photo</label>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />

          <div
            className="uploadBox"
            onClick={() => fileInputRef.current.click()}
            style={{ cursor: "pointer", overflow: "hidden" }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: "100%", height: "120px", objectFit: "contain" }}
              />
            ) : (
              <>
                <div className="uploadIcon">⬆</div>
                <div className="uploadText">
                  Click to upload or drag and drop
                </div>
                <div className="uploadHint">PNG, JPG up to 5MB</div>
              </>
            )}
          </div>

          <div className="field">
            <label className="label">
              ID Number <span className="req">*</span>
            </label>
            <input
              name="id_number"
              value={formData.id_number}
              className="input"
              placeholder="e.g., 2022300199"
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="label">
              Full Name <span className="req">*</span>
            </label>
            <input
              name="full_name"
              value={formData.full_name}
              className="input"
              placeholder="e.g., Juan Dela Cruz"
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="label">
              Program <span className="req">*</span>
            </label>
            <input
              name="program"
              value={formData.program}
              className="input"
              placeholder="e.g., BSIT"
              onChange={handleChange}
            />
          </div>

          <div className="field2">
            <label className="label">
              Year Level <span className="req">*</span>
            </label>
            <select name="year_level" value={formData.year_level} className="input" onChange={handleChange}>
              <option value="">Select year level</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          {/* 3. NEW: Gender Field */}
          <div className="field2">
            <label className="label">
              Gender <span className="req">*</span>
            </label>
            <select 
              name="gender" 
              value={formData.gender} 
              className="input" 
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="field">
            <label className="label">
              Age <span className="req">*</span>
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              className="input"
              placeholder="e.g., 20"
              min="10"
              max="100"
              onChange={handleChange}
            />
          </div>

          <div className="field2">
            <label className="label">Validity Status</label>
            <select
              name="validity_status"
              value={formData.validity_status}
              className="input"
              onChange={handleChange}
            >
              <option value="NOT_VERIFIED">Not Verified</option>
              <option value="VERIFIED">Verified</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>

          <div style={{ height: 24 }} />
        </div>

        <div className="modalFooter">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSave}>
            {editData ? "Update Record" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}