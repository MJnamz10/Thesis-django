import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import "../css/login.css"; 

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      if (response.ok) {
        // Only show the success checkmark if Django successfully processed it
        setIsSubmitted(true);
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } catch (err) {
      setError("Cannot connect to the server. Is Django running?");
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
        {isSubmitted ? (
          // --- SUCCESS STATE ---
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#16a34a' }}>
              <CheckCircle size={48} />
            </div>
            <h1 className="login-title">Check your email</h1>
            <p className="login-subtitle">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <button onClick={() => navigate("/")} className="sign-in-btn" style={{ marginTop: '24px' }}>
              Return to Login
            </button>
          </div>
        ) : (
          // --- INPUT STATE ---
          <>
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Enter your email and we'll send you a reset link.</p>

            {error && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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

              <button type="submit" className="sign-in-btn" style={{ marginTop: '10px' }}>
                Send Reset Link
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button 
                onClick={() => navigate("/")} 
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
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