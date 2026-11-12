import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  CalendarCheck,
  FileSpreadsheet,
  ClipboardCheck,
  FileBarChart,
  Fingerprint,
  Settings,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Students", icon: Users },
  { name: "Courses", icon: BookOpen },
  { name: "Batches", icon: Layers },
  { name: "Attendance", icon: CalendarCheck },
  { name: "Excel Import", icon: FileSpreadsheet },
  { name: "Reconciliation", icon: ClipboardCheck },
  { name: "Reports", icon: FileBarChart },
  { name: "Biometric Devices", icon: Fingerprint },
  { name: "Settings", icon: Settings },
];

export default function Sidebar({
  activePage,
  setActivePage,
  open,
  onClose,
}) {
  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">
            <Fingerprint size={27} />
          </div>

          <div>
            <h2>NIELIT</h2>
            <p>Smart Attendance</p>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-navigation">
          {menuItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(name);
                onClose();
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          <div>
            <strong>Development mode</strong>
            <p>Local frontend</p>
          </div>
        </div>
      </aside>
    </>
  );
}