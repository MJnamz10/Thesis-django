import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { User, LogOut } from "lucide-react"; 
import "../css/AdminMenu.css"; 

export default function AdminMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("admin@ustp.edu.ph"); // Fallback email just in case
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  // 1. 👉 NEW: Fetch the logged-in email when the component loads
  useEffect(() => {
    // Look for the email in local storage or session storage
    const storedEmail = localStorage.getItem("logged_in_email") || sessionStorage.getItem("logged_in_email");
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  // The "Click Outside" Magic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Sign Out Logic
  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("logged_in_email"); // 👉 Clear the email on logout!
    
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("logged_in_email");
    
    navigate("/"); 
  };

  return (
    <div className="admin-menu-container" ref={menuRef}>
      <button 
        className="admin-avatar-btn" 
        onClick={toggleMenu} 
        aria-label="Admin Menu"
        style={{ width: '56px', height: '56px' }} 
      >
        <User 
          size={32} 
          strokeWidth={2} 
          style={{ width: '32px', height: '32px', minWidth: '32px' }} 
        />
      </button>

      {isOpen && (
        <div className="admin-dropdown">
          <div className="admin-info">
            <span className="admin-name">Admin</span>
            {/* 2. 👉 NEW: Display the dynamic email here! */}
            <span className="admin-role">{userEmail}</span>
          </div>
          
          <hr className="dropdown-divider" />
          
          <button className="sign-out-btn" onClick={handleSignOut}>
            <LogOut size={18} strokeWidth={2} className="logout-icon" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}