import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import "../css/login.css"; 

export default function ResetPassword() {
  const navigate = useNavigate();
  // Grab the secure codes from the URL
  const { uid, token } = useParams(); 
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      // 2. Send the new password + the URL tokens back to Django
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/reset-password-confirm/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          uid: uid, 
          token: token, 
          new_password: password 
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || "Invalid or expired reset link. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to the server.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-header-text">
        <img src="/images/logo.png" alt="VerifID Logo" style={{ height: '40px', marginBottom: '8px' }} />
        <h2>
          University of Science and Technology of Southern Philippines |<br />
          Cagayan de Oro Campus
        </h2>
      </div>

      <div className="login-card">
        {isSuccess ? (
          // --- SUCCESS STATE ---
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#16a34a' }}>
              <CheckCircle size={48} />
            </div>
            <h1 className="login-title">Password Reset!</h1>
            <p className="login-subtitle">
              Your password has been successfully updated.
            </p>
            <button onClick={() => navigate("/")} className="sign-in-btn" style={{ marginTop: '24px' }}>
              Go to Login
            </button>
          </div>
        ) : (
          // --- INPUT STATE ---
          <>
            <h1 className="login-title">Create New Password</h1>
            <p className="login-subtitle">Please enter your new password below.</p>

            {error && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password Field */}
              <div className="input-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {showPassword ? (
                    <EyeOff size={18} className="input-icon-right" onClick={() => setShowPassword(false)} />
                  ) : (
                    <Eye size={18} className="input-icon-right" onClick={() => setShowPassword(true)} />
                  )}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {showConfirmPassword ? (
                    <EyeOff size={18} className="input-icon-right" onClick={() => setShowConfirmPassword(false)} />
                  ) : (
                    <Eye size={18} className="input-icon-right" onClick={() => setShowConfirmPassword(true)} />
                  )}
                </div>
              </div>

              <button type="submit" className="sign-in-btn" style={{ marginTop: '10px' }}>
                Save Password
              </button>
            </form>
          </>
        )}
      </div>

      <div className="login-footer">
        VerifID Admin Portal v1.0<br />
        © 2026 USTP Cagayan de Oro Campus
      </div>
    </div>
  );
}