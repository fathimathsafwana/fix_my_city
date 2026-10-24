import { Link } from "react-router-dom";

export default function AdminHeader({
  activeTab,
  departmentFilter,
  currentDept,
  complaintStats,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
}) {
  const avatarLetter = (currentUser?.name || "A").charAt(0).toUpperCase();
  const adminName = currentUser?.name || "Administrator";
  const adminEmail = currentUser?.email || "admin@gmail.com";

  return (
    <header className="dept-topbar">
      <div className="dept-topbar-left">
        <button
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          title="Open Navigation"
        >
          ☰
        </button>
        <div className="dept-header-title-wrap">
          <h1 className="dept-page-heading">
            {activeTab === "complaints" ? (
              departmentFilter === "Unassigned" ? (
                <span>Unassigned Complaints</span>
              ) : currentDept ? (
                <span>{currentDept.name}</span>
              ) : (
                <span className="accent-text">Complaints</span>
              )
            ) : activeTab === "users" ? (
              <span className="accent-text">Users</span>
            ) : activeTab === "departments" ? (
              <span className="accent-text">Departments</span>
            ) : (
              <span className="accent-text">Feedback</span>
            )}
          </h1>
          <p className="dept-page-subheading">
            {activeTab === "complaints"
              ? departmentFilter === "Unassigned"
                ? `Complaints pending municipal department assignment • ${complaintStats?.total || 0} complaints`
                : currentDept
                ? `Managing complaints assigned to ${currentDept.name} • ${complaintStats?.total || 0} complaints`
                : `Central civic grievance repository`
              : activeTab === "users"
              ? `Platform user directory`
              : activeTab === "departments"
              ? `Municipal department directory`
              : `Citizen satisfaction ratings & portal feedback`}
          </p>
        </div>
      </div>

      {/* Admin Profile in Right Side of Header */}
      <div className="dept-topbar-right">
        <Link
          to="/profile"
          className="admin-header-profile"
          title={`Signed in as ${adminEmail} • Click to view profile`}
        >
          <div className="admin-header-avatar">
            {avatarLetter}
          </div>
          <div className="admin-header-info">
            <span className="admin-header-name">{adminName}</span>
            <span className="admin-header-role">🛡️ Admin</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
