import { useEffect, useState } from "react";

import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";

import PublicHome from "./pages/PublicHome.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Courses from "./pages/Courses.jsx";
import Batches from "./pages/Batches.jsx";
import Attendance from "./pages/Attendance.jsx";
import ImportStudents from "./pages/ImportStudents.jsx";
import Reconciliation from "./pages/Reconciliation.jsx";
import Reports from "./pages/Reports.jsx";
import Devices from "./pages/Devices.jsx";
import Settings from "./pages/Settings.jsx";

import {
  apiRequest,
  clearToken,
  getToken
} from "./services/api";

const pages = {
  Dashboard,
  Students,
  Courses,
  Batches,
  Attendance,
  "Excel Import": ImportStudents,
  Reconciliation,
  Reports,
  "Biometric Devices": Devices,
  Settings
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [authMode, setAuthMode] = useState("home");
  const [pendingPage, setPendingPage] = useState("Dashboard");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      if (!getToken()) {
        if (mounted) setCheckingSession(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me");

        if (mounted) {
          setUser(data.user);
        }
      } catch {
        clearToken();

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    function handleExpiredSession() {
      clearToken();
      setUser(null);
      setAuthMode("login");
    }

    window.addEventListener(
      "nielit:session-expired",
      handleExpiredSession
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "nielit:session-expired",
        handleExpiredSession
      );
    };
  }, []);

  function handleOpenModule(pageName) {
    setPendingPage(pageName);
    setAuthMode("choice");
  }

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
    setActivePage(pendingPage);
    setAuthMode("home");
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setActivePage("Dashboard");
    setPendingPage("Dashboard");
    setAuthMode("home");
  }

  if (checkingSession) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Checking your session...</p>
      </div>
    );
  }

  // Public homepage
  if (!user && authMode === "home") {
    return (
      <PublicHome
        onOpenModule={handleOpenModule}
        onLogin={() => setAuthMode("login")}
        onRegister={() => setAuthMode("register")}
      />
    );
  }

  // Ask the visitor to choose login or registration
  if (!user && authMode === "choice") {
    return (
      <main className="login-page">
        <section className="login-form-section">
          <div className="login-card">
            <span className="login-welcome">
              AUTHENTICATION REQUIRED
            </span>

            <h1>Access {pendingPage}</h1>

            <p className="login-subtitle">
              Please sign in if you already have an account,
              or register if you are a new user.
            </p>

            <button
              className="login-submit"
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>

            <button
              className="login-submit"
              style={{
                marginTop: "12px",
                background: "#172f5b"
              }}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>

            <p className="auth-links">
              <button onClick={() => setAuthMode("home")}>
                Back to home
              </button>
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Login page
  if (!user && authMode === "login") {
    return (
      <Login
        onLogin={handleAuthenticated}
        onSwitchToRegister={() => setAuthMode("register")}
        onBackHome={() => setAuthMode("home")}
      />
    );
  }

  // Registration page
  if (!user && authMode === "register") {
    return (
      <Register
        onRegistered={handleAuthenticated}
        onSwitchToLogin={() => setAuthMode("login")}
        onBackHome={() => setAuthMode("home")}
      />
    );
  }

  // Protected workspace
  const ActivePage = pages[activePage] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <Topbar
          activePage={activePage}
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        <div className="page-content">
          <ActivePage />
        </div>

        <footer className="app-footer">
          <span>NIELIT Kolkata · Smart Attendance System</span>
          <span>Authorized workspace</span>
        </footer>
      </main>
    </div>
  );
}