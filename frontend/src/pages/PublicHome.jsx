import {
  Fingerprint,
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  CalendarCheck,
  FileSpreadsheet,
  ClipboardCheck,
  FileBarChart,
  ShieldCheck
} from "lucide-react";

import "../styles/PublicHome.css";

const modules = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Students", icon: Users },
  { name: "Courses", icon: BookOpen },
  { name: "Batches", icon: Layers },
  { name: "Attendance", icon: CalendarCheck },
  { name: "Excel Import", icon: FileSpreadsheet },
  { name: "Reconciliation", icon: ClipboardCheck },
  { name: "Reports", icon: FileBarChart }
];

export default function PublicHome({
  onOpenModule,
  onLogin,
  onRegister
}) {
  return (
    <main className="public-home">
      <header className="public-header">
        <div className="public-brand">
          <Fingerprint size={32} />
          <div>
            <h2>NIELIT</h2>
            <p>Smart Attendance System</p>
          </div>
        </div>

        <div className="public-header-actions">
          <button onClick={onLogin} className="public-login-btn">
            Login
          </button>

          <button onClick={onRegister} className="public-register-btn">
            Register
          </button>
        </div>
      </header>

      <section className="public-hero">
        <span className="public-eyebrow">
          NIELIT KOLKATA
        </span>

        <h1>
          Smart Attendance
          <br />
          Management System
        </h1>

        <p>
          Manage student records, daily attendance, batches,
          courses and institutional reports through one
          centralized platform.
        </p>

        <div className="public-hero-actions">
          <button onClick={onLogin}>
            Sign in to your account
          </button>

          <button onClick={onRegister}>
            Create an account
          </button>
        </div>
      </section>

      <section className="public-modules">
        <div className="public-section-heading">
          <div>
            <span>WORKSPACE</span>
            <h2>Explore system modules</h2>
            <p>
              Select a module to continue. Authentication is
              required to access the workspace.
            </p>
          </div>

          <ShieldCheck size={34} />
        </div>

        <div className="public-module-grid">
          {modules.map(({ name, icon: Icon }) => (
            <button
              className="public-module-card"
              key={name}
              onClick={() => onOpenModule(name)}
            >
              <Icon size={25} />
              <strong>{name}</strong>
              <span>Open module →</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        © NIELIT Kolkata · Smart Attendance System
      </footer>
    </main>
  );
}