import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import "../css/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(
    () => localStorage.getItem("saved_email") || "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem("saved_email"),
  );

  useEffect(() => {
    if (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    ) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear old errors

    try {
      // 1. Send the data to Django
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Django's default auth expects a 'username' field.
        // We will pass your email input into the username field.
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      // 2. Check if the login was successful
      if (response.ok) {
        // Decide WHERE to save the tokens based on the checkbox
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("access_token", data.access);
        storage.setItem("refresh_token", data.refresh);
        localStorage.setItem("logged_in_email", email);

        // If they want to be remembered, save their email for next time
        if (rememberMe) {
          localStorage.setItem("saved_email", email);
        } else {
          localStorage.removeItem("saved_email");
        }

        // Navigate to the dashboard!
        navigate("/dashboard");
      } else {
        // If Django says "Unauthorized", show an error message
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to the server. Is Django running?");
    }
  };

  return (
    <div className="login-wrapper">
      {/* Top Logo Area */}
      <div className="login-header-text">
        <img
          src="/images/logo.png"
          alt="VerifID Logo"
          style={{ height: "60px", marginBottom: "8px" }}
        />
        <h2>
          University of Science and Technology of Southern Philippines |<br />
          Cagayan de Oro Campus
        </h2>
      </div>

      {/* Main Login Card */}
      <div className="login-card">
        <div className="login-icon-container">
          <div className="login-icon-box">
            <Lock size={20} />
          </div>
        </div>

        <h1 className="login-title">Admin Login</h1>
        <p className="login-subtitle">Sign in to access the admin dashboard</p>

        {/* NEW: Display the error message if there is one */}
        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              textAlign: "center",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon-left" />
              <input
                type="email"
                className="login-input"
                placeholder="admin@ustp.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon-left" />
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Toggle Eye Icon */}
              {showPassword ? (
                <EyeOff
                  size={18}
                  className="input-icon-right"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <Eye
                  size={18}
                  className="input-icon-right"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>

          {/* Options Row */}
          <div className="options-row">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <span
              className="forgot-password"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          <button type="submit" className="sign-in-btn">
            Sign In
          </button>
        </form>

        <p className="login-disclaimer">
          Authorized personnel only. All access attempts are logged and
          monitored.
        </p>
      </div>

      {/* Bottom Footer Area */}
      <div className="login-footer">
        VerifID Admin Portal v1.0
        <br />© 2026 USTP Cagayan de Oro Campus
      </div>
    </div>
  );
}
