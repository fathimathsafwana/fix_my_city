import { Link } from "react-router-dom";

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onLogout,
  onTabChange,
}) {
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setIsMobileOpen(false);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  return (
    <aside
      className={`dept-sidebar ${isCollapsed ? "collapsed" : ""} ${
        isMobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Brand Header */}
      <div className="dept-sidebar-brand">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">🏛️</span>
          {!isCollapsed && (
            <span className="sidebar-logo-text">FixMyCity</span>
          )}
        </Link>
        <button
          className="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "»" : "«"}
        </button>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="dept-sidebar-scroll">
        <div className="dept-nav-group">
          {!isCollapsed && (
            <div className="dept-nav-group-title">ADMIN MODULES</div>
          )}

          <button
            className={`dept-nav-item ${activeTab === "complaints" ? "active" : ""}`}
            onClick={() => handleTabClick("complaints")}
            title="Complaints - View All Complaints"
          >
            <span className="nav-item-icon">📋</span>
            {!isCollapsed && <span className="nav-item-label">Complaints</span>}
          </button>

          <button
            className={`dept-nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabClick("users")}
            title="Users - View All Users"
          >
            <span className="nav-item-icon">👥</span>
            {!isCollapsed && <span className="nav-item-label">Users</span>}
          </button>

          <button
            className={`dept-nav-item ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => handleTabClick("departments")}
            title="Departments - Manage Departments"
          >
            <span className="nav-item-icon">🏢</span>
            {!isCollapsed && <span className="nav-item-label">Departments</span>}
          </button>

          <button
            className={`dept-nav-item ${activeTab === "feedbacks" ? "active" : ""}`}
            onClick={() => handleTabClick("feedbacks")}
            title="Feedback - Citizen Feedback"
          >
            <span className="nav-item-icon">⭐</span>
            {!isCollapsed && <span className="nav-item-label">Feedback</span>}
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="dept-sidebar-footer">
        <button
          className="sidebar-action-btn logout"
          onClick={onLogout}
          title="Sign out"
        >
          <span>🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

