import { useState } from "react";
import {
  Fingerprint,
  User,
  Mail,
  LockKeyhole
} from "lucide-react";

import { apiRequest, saveToken } from "../services/api";
import "../styles/Login.css";

export default function Register({
  onRegistered,
  onSwitchToLogin,
  onBackHome
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all three fields.");
      return;
    }

    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });

      if (!data.token || !data.user) {
        throw new Error("Invalid registration response.");
      }

      saveToken(data.token);
      onRegistered(data.user);

    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Fingerprint size={30} />
          </div>
          <div>
            <h2>NIELIT</h2>
            <p>
              National Institute of Electronics &
              Information Technology
            </p>
          </div>
        </div>

        <div className="login-visual-content">
          <span className="login-tag">NEW USER REGISTRATION</span>
          <h1>Join the Smart Attendance workspace.</h1>
          <p>
            Create your account to access student records,
            attendance, courses and reports.
          </p>
        </div>

        <p className="login-visual-footer">
          NIELIT Kolkata · Smart Attendance System
        </p>
      </section>

      <section className="login-form-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-mobile-brand">
            <Fingerprint size={28} />
            <strong>NIELIT Smart Attendance</strong>
          </div>

          <span className="login-welcome">GET STARTED</span>
          <h1>Create your account</h1>

          <p className="login-subtitle">
            Enter your details to register as a staff user.
          </p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="login-label" htmlFor="register-name">
            Full name
          </label>

          <div className="login-input-wrap">
            <User size={18} />
            <input
              id="register-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </div>

          <label className="login-label" htmlFor="register-email">
            Email address
          </label>

          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="register-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label className="login-label" htmlFor="register-password">
            Password
          </label>

          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="register-password"
              type="password"
              placeholder="Create a password (12 characters minimum)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="auth-links">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </p>

          <p className="auth-links">
            <button type="button" onClick={onBackHome}>
              Back to home
            </button>
          </p>
        </form>

        <p className="login-copyright">
          © NIELIT Kolkata · Smart Attendance System
        </p>
      </section>
    </main>
  );
}