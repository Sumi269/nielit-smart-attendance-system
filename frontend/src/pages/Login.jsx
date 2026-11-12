
import { useState } from "react";
import {
  Fingerprint,
  Eye,
  EyeOff,
  LockKeyhole
} from "lucide-react";

import { apiRequest, saveToken } from "../services/api";
import "../styles/Login.css";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!password.trim()) {
      setError("Please enter the administrator password.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });

      if (!data.token || !data.user) {
        throw new Error("Invalid server response.");
      }

      saveToken(data.token);
      onLogin(data.user);

    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please try again."
      );
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
              National Institute of Electronics
              & Information Technology
            </p>
          </div>
        </div>

        <div className="login-visual-content">
          <span className="login-tag">
            SMART CAMPUS MANAGEMENT
          </span>

          <h1>Attendance management, made smarter.</h1>

          <p>
            Centralized student records, daily attendance,
            biometric integration and institutional reports.
          </p>

          <div className="login-feature">
            <Fingerprint size={20} />
            <span>Biometric attendance integration</span>
          </div>

          <div className="login-feature">
            <LockKeyhole size={20} />
            <span>Secure administrator access</span>
          </div>
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

          <span className="login-welcome">
            ADMINISTRATOR ACCESS
          </span>

          <h1>Welcome back</h1>

          <p className="login-subtitle">
            Enter the authorized shared administrator password.
          </p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="login-label" htmlFor="password">
            Administrator password
          </label>

          <div className="login-input-wrap">
            <LockKeyhole size={18} />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter administrator password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword
                ? <EyeOff size={18} />
                : <Eye size={18} />
              }
            </button>
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-security">
            <LockKeyhole size={14} />
            Authorized administrators only.
          </p>
        </form>

        <p className="login-copyright">
          © NIELIT Kolkata · Smart Attendance System
        </p>
      </section>
    </main>
  );
}
