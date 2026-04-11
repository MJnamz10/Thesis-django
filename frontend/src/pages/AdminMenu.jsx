import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import "../css/AdminMenu.css";

export default function AdminMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const [userEmail] = useState(() => {
    return (
      localStorage.getItem("logged_in_email") ||
      sessionStorage.getItem("logged_in_email") ||
      "admin@ustp.edu.ph"
    );
  });

  const [userName] = useState(() => {
    return (
      localStorage.getItem("logged_in_username") ||
      sessionStorage.getItem("logged_in_username") ||
      "Admin" // Fallback if no name is found
    );
  });

  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("logged_in_email");
    localStorage.removeItem("logged_in_username"); 

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("logged_in_email");
    sessionStorage.removeItem("logged_in_username");

    navigate("/");
  };

  return (
    <div className="admin-menu-container" ref={menuRef}>
      <button
        className="admin-avatar-btn"
        onClick={toggleMenu}
        aria-label="Admin Menu"
        style={{ width: "48px", height: "48px" }}
      >
        <User
          size={32}
          strokeWidth={2}
          style={{ width: "32px", height: "30px", minWidth: "30px", color: "#1c398e" }}
        />
      </button>

      {isOpen && (
        <div className="admin-dropdown">
          <div className="admin-info">
            {/* 👉 Use the dynamic state here */}
            <span className="admin-name" style={{ textTransform: "capitalize" }}>
              {userName}
            </span>
            <span className="admin-role">{userEmail}</span>
          </div>

          <hr className="dropdown-divider" />

          <button className="sign-out-btn" onClick={handleSignOut}>
            <LogOut size={18} strokeWidth={2} color="#dc3545" className="logout-icon" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}