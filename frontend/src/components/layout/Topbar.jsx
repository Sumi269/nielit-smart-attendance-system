
import { Menu, Bell, Wifi, LogOut } from "lucide-react";

export default function Topbar({
  activePage,
  onMenuClick,
  user,
  onLogout,
}) {
  const initials = (user?.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <span>/</span>
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="connection-status">
          <Wifi size={16} />
          <span>Connected workspace</span>
        </div>

        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
        </button>

        <div className="profile">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-details">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>

        <button
          className="icon-button"
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
