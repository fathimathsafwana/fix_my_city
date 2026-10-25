import Pagination from "../Pagination";

export default function UsersTab({
  users = [],
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
                          {u.isBlocked ? "🔓" : "🚫"}
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

      {/* USERS CARDS GRID VIEW */}
      {!loadingUsers && filteredUsers.length > 0 && viewMode === "cards" && (
        <div className="dashboard-cards-grid">
          {paginatedUsers.map((u) => (
            <div className="user-card-pro" key={u._id}>
              <div
                className="card-top-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span className="id-badge">#{u._id.slice(-6)}</span>
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
              </div>

              <div className="user-card-header">
                <div className="user-card-title-group">
                  <h4 className="user-card-name">{u.name || "Citizen"}</h4>
                  <span className="user-card-email">{u.email}</span>
                </div>
              </div>

              <div className="card-controls-footer">
                <span className="card-date">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "Active"}
                </span>
                <div className="table-action-icons">
                  <button
                    className="btn-action-icon btn-view-icon"
                    onClick={() => onViewUser(u)}
                    title="View Details"
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
                    {u.isBlocked ? "🔓" : "🚫"}
                  </button>
                  <button
                    className="btn-action-icon btn-delete-icon"
                    onClick={() => onDeleteUser(u._id, u.name)}
                    title="Delete User"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
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
