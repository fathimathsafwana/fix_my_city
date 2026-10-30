import Pagination from "../Pagination";

const getUserTheme = (user = {}) => {
  if (user.isBlocked) {
    return {
      avatarBg: "linear-gradient(135deg, rgba(239, 68, 68, 0.28) 0%, rgba(185, 28, 28, 0.15) 100%)",
      accent: "#ef4444",
      glow: "rgba(239, 68, 68, 0.25)",
      border: "rgba(239, 68, 68, 0.35)",
      borderHover: "rgba(239, 68, 68, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(239, 68, 68, 0.15)",
      roleLabel: "Blocked Account",
    };
  }
  if (user.role === "admin") {
    return {
      avatarBg: "linear-gradient(135deg, rgba(163, 230, 53, 0.28) 0%, rgba(132, 204, 22, 0.15) 100%)",
      accent: "#a3e635",
      glow: "rgba(163, 230, 53, 0.25)",
      border: "rgba(163, 230, 53, 0.35)",
      borderHover: "rgba(163, 230, 53, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(163, 230, 53, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(163, 230, 53, 0.15)",
      roleLabel: "System Administrator",
    };
  }
  if (user.role === "department") {
    return {
      avatarBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.15) 100%)",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      border: "rgba(245, 158, 11, 0.35)",
      borderHover: "rgba(245, 158, 11, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(245, 158, 11, 0.15)",
      roleLabel: "Department Officer",
    };
  }
  return {
    avatarBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.28) 0%, rgba(14, 165, 233, 0.15) 100%)",
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.25)",
    border: "rgba(56, 189, 248, 0.35)",
    borderHover: "rgba(56, 189, 248, 0.6)",
    heroBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
    pillBg: "rgba(56, 189, 248, 0.15)",
    roleLabel: "Verified Citizen",
  };
};

export default function UsersTab({
  users = [],
  issues = [],
  filteredUsers = [],
  paginatedUsers = [],
  userStats = {},
  loadingUsers = false,
  userSearchQuery = "",
  setUserSearchQuery,
  viewMode = "table",
  setViewMode,
  usersPage = 1,
  setUsersPage,
  usersPageSize = 5,
  setUsersPageSize,
  totalUsersPages = 1,
  onViewUser,
  onToggleBlockUser,
  onDeleteUser,
}) {
  return (
    <>
      {/* User Statistics Highlights */}
      <div className="stats-grid">
        <div className="stat-card" title="Total registered platform citizens">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{userStats.total || 0}</span>
            <span className="stat-label">Total Citizens</span>
          </div>
        </div>

        <div className="stat-card" title="Active platform citizens">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: "#4ade80" }}>{userStats.active || 0}</span>
            <span className="stat-label">Active Citizens</span>
          </div>
        </div>

        <div className="stat-card" title="Blocked citizens">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: (userStats.blocked || 0) > 0 ? "#f87171" : "inherit" }}>
              {userStats.blocked || 0}
            </span>
            <span className="stat-label">Blocked Citizens</span>
          </div>
        </div>
      </div>

      {/* User Management Toolbar */}
      <div className="complaints-center-toolbar">
        <div className="toolbar-left-controls">
          <div className="toolbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            {userSearchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setUserSearchQuery("")}
                title="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-right-meta">
          <div className="view-mode-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
              type="button"
            >
              📋
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Cards View"
              type="button"
            >
              🗂️
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingUsers && (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      )}

      {/* Empty State */}
      {!loadingUsers && filteredUsers.length === 0 && (
        <div className="no-issues-placeholder">
          <h3>No Citizens Found</h3>
          <p>
            {users.length === 0
              ? "No citizens have registered on the portal yet."
              : "No citizens match your search query."}
          </p>
        </div>
      )}

      {/* USERS TABLE VIEW */}
      {!loadingUsers && filteredUsers.length > 0 && viewMode === "table" && (
        <div className="pro-table-wrapper">
          <div className="pro-table-scroll">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="col-id">User ID</th>
                  <th className="col-u-user">Citizen Details</th>
                  <th className="col-u-dept">Status</th>
                  <th className="col-u-date" style={{ textAlign: "center" }}>Registered</th>
                  <th className="col-u-act" style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="col-id">
                      <span className="id-badge">#{u._id.slice(-6)}</span>
                    </td>

                    <td className="col-u-user">
                      <div className="user-info-text">
                        <span className="user-fullname">{u.name || "Citizen"}</span>
                        <span className="user-email-text">{u.email}</span>
                      </div>
                    </td>

                    <td className="col-u-dept">
                      <button
                        type="button"
                        className={`pro-status-badge ${
                          u.isBlocked ? "status-blocked" : "status-active"
                        }`}
                        onClick={() => onToggleBlockUser(u)}
                        title={u.isBlocked ? "Click to Unblock Citizen" : "Click to Block Citizen"}
                      >
                        <span className="status-dot"></span>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </button>
                    </td>

                    <td className="col-u-date" style={{ textAlign: "center" }}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "Active"}
                    </td>

                    <td className="col-u-act">
                      <div className="table-action-icons">
                        <button
                          className="btn-action-icon btn-view-icon"
                          onClick={() => onViewUser(u)}
                          title="View Citizen Details"
                          type="button"
                        >
                          👁️
                        </button>
                        <button
                          className={`btn-action-icon ${
                            u.isBlocked ? "btn-unblock-icon" : "btn-block-icon"
                          }`}
                          onClick={() => onToggleBlockUser(u)}
                          title={u.isBlocked ? "Unblock Citizen" : "Block Citizen"}
                          type="button"
                        >
                          {u.isBlocked ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="8.5" cy="7" r="4"></circle>
                              <line x1="17" y1="9" x2="23" y2="15"></line>
                              <line x1="23" y1="9" x2="17" y2="15"></line>
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="8.5" cy="7" r="4"></circle>
                              <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                          )}
                        </button>
                        <button
                          className="btn-action-icon btn-delete-icon"
                          onClick={() => onDeleteUser(u._id, u.name)}
                          title="Delete Citizen"
                          type="button"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS BENTO CARDS GRID VIEW */}
      {!loadingUsers && filteredUsers.length > 0 && viewMode === "cards" && (
        <div className="dashboard-cards-grid">
          {paginatedUsers.map((u) => {
            const theme = getUserTheme(u);
            const userComplaints = issues.filter(
              (i) => (typeof i.user === "object" && i.user !== null ? i.user._id : i.user) === u._id
            );
            const userResolved = userComplaints.filter(
              (i) => i.status === "Resolved" || !!i.resolvedPhoto
            ).length;
            const userPending = userComplaints.length - userResolved;
            const resolvedRate = userComplaints.length > 0 ? Math.round((userResolved / userComplaints.length) * 100) : 0;
            const initials = (u.name || "C")
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "C";

            return (
              <div
                className="dept-bento-card user-bento-card"
                key={u._id}
                style={{
                  "--dept-color": theme.accent,
                  "--dept-glow": theme.glow,
                  "--dept-border": theme.border,
                  "--dept-border-hover": theme.borderHover,
                  "--dept-hero-bg": theme.heroBg,
                  "--dept-pill-bg": theme.pillBg,
                }}
              >
                {/* Hero Header Banner */}
                <div className="dept-bento-hero">
                  <div className="dept-bento-hero-top">
                    <div
                      className="dept-bento-icon-wrapper"
                      style={{
                        background: theme.avatarBg,
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "17px",
                        letterSpacing: "0.5px",
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <span>{initials}</span>
                    </div>

                    <div className="dept-bento-badges">
                      <span className="dept-bento-id">#{u._id.slice(-6)}</span>
                      <button
                        type="button"
                        className={`pro-status-badge ${
                          u.isBlocked ? "status-blocked" : "status-active"
                        }`}
                        onClick={() => onToggleBlockUser(u)}
                        title={u.isBlocked ? "Click to Unblock Citizen" : "Click to Block Citizen"}
                        style={{ cursor: "pointer" }}
                      >
                        <span className="status-dot"></span>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </button>
                    </div>
                  </div>

                  <h3 className="dept-bento-title" title={u.name}>
                    {u.name || "Citizen"}
                  </h3>
                  <div style={{ marginTop: "4px", fontSize: "12px", color: theme.accent, fontWeight: 600 }}>
                    {theme.roleLabel}
                  </div>
                </div>

                {/* Card Body */}
                <div className="dept-bento-body">
                  {/* Citizen Email Strip */}
                  <div className="dept-bento-email-strip">
                    <span>✉️</span>
                    <span className="dept-bento-email-text">{u.email}</span>
                  </div>

                  {/* Citizen Activity Metric Box */}
                  <div className="dept-bento-resolution-wrap">
                    <div className="dept-bento-resolution-header">
                      <span className="dept-bento-res-label">Citizen Complaints</span>
                      <span className="dept-bento-res-rate">
                        {userComplaints.length} Filed
                      </span>
                    </div>
                    {userComplaints.length > 0 ? (
                      <>
                        <div className="dept-bento-progress-track">
                          {userResolved > 0 && (
                            <div
                              className="dept-bento-progress-bar bar-resolved"
                              style={{ width: `${resolvedRate}%` }}
                              title={`${userResolved} Resolved`}
                            />
                          )}
                          {userPending > 0 && (
                            <div
                              className="dept-bento-progress-bar bar-pending"
                              style={{ width: `${100 - resolvedRate}%` }}
                              title={`${userPending} Pending / In Progress`}
                            />
                          )}
                        </div>
                        <div className="dept-bento-resolution-legend">
                          <span className="dept-legend-item">
                            <span className="dept-legend-dot dot-resolved" /> {userResolved} Resolved
                          </span>
                          <span className="dept-legend-item">
                            <span className="dept-legend-dot dot-pending" /> {userPending} In Progress
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                        ✨ No grievances filed yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="dept-bento-footer">
                  <span className="dept-bento-date">
                    📅 {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                  </span>
                  <div className="dept-bento-actions">
                    <button
                      className="btn-bento-action btn-bento-primary"
                      onClick={() => onViewUser(u)}
                      title="View Citizen Details"
                      type="button"
                    >
                      👁️
                    </button>
                    <button
                      className={`btn-bento-action ${u.isBlocked ? "btn-bento-unblock" : "btn-bento-block"}`}
                      onClick={() => onToggleBlockUser(u)}
                      title={u.isBlocked ? "Unblock Citizen" : "Block Citizen"}
                      type="button"
                    >
                      {u.isBlocked ? "🔓" : "🚫"}
                    </button>
                    <button
                      className="btn-bento-action btn-bento-delete"
                      onClick={() => onDeleteUser(u._id, u.name)}
                      title="Delete User"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users Pagination */}
      {!loadingUsers && filteredUsers.length > 0 && (
        <Pagination
          currentPage={usersPage}
          totalPages={totalUsersPages}
          totalItems={filteredUsers.length}
          pageSize={usersPageSize}
          onPageChange={setUsersPage}
          onPageSizeChange={setUsersPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </>
  );
}
