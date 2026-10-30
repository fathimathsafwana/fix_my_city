import Pagination from "../Pagination";

const getDeptTheme = (name = "") => {
  const n = (name || "").toLowerCase();
  if (n.includes("sanitat") || n.includes("waste") || n.includes("garbage")) {
    return {
      icon: "🗑️",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      border: "rgba(16, 185, 129, 0.35)",
      borderHover: "rgba(16, 185, 129, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(16, 185, 129, 0.15)",
      tag: "Sanitation & Waste",
    };
  }
  if (n.includes("road") || n.includes("pothole") || n.includes("infrastruct")) {
    return {
      icon: "🚧",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.25)",
      border: "rgba(245, 158, 11, 0.35)",
      borderHover: "rgba(245, 158, 11, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(245, 158, 11, 0.15)",
      tag: "Roads & Civil",
    };
  }
  if (n.includes("water") || n.includes("drain") || n.includes("sewer")) {
    return {
      icon: "🚰",
      accent: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.25)",
      border: "rgba(6, 182, 212, 0.35)",
      borderHover: "rgba(6, 182, 212, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(6, 182, 212, 0.15)",
      tag: "Water Supply & Drainage",
    };
  }
  return {
    icon: "🏢",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.25)",
    border: "rgba(168, 85, 247, 0.35)",
    borderHover: "rgba(168, 85, 247, 0.6)",
    heroBg: "linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
    pillBg: "rgba(168, 85, 247, 0.15)",
    tag: "Municipal Authority",
  };
};

export default function DepartmentsTab({
  departments = [],
  filteredDepartments = [],
  paginatedDepartments = [],
  deptSearchQuery = "",
  setDeptSearchQuery,
  viewMode = "table",
  setViewMode,
  departmentsPage = 1,
  setDepartmentsPage,
  departmentsPageSize = 5,
  setDepartmentsPageSize,
  totalDepartmentsPages = 1,
  issues = [],
  onOpenCreateDept,
  onViewDept,
  onEditDept,
  onDeleteDept,
}) {
  return (
    <>
      {/* Department Toolbar */}
      <div className="complaints-center-toolbar">
        <div className="toolbar-left-controls">
          <div className="toolbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search departments..."
              value={deptSearchQuery}
              onChange={(e) => setDeptSearchQuery(e.target.value)}
            />
            {deptSearchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setDeptSearchQuery("")}
                title="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          <button
            className="btn-create-dept"
            onClick={onOpenCreateDept}
            type="button"
          >
            <span>➕</span> Create Department
          </button>
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

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div className="no-issues-placeholder">
          <h3>No Departments Found</h3>
          <p>
            {departments.length === 0
              ? "No departments registered. Click 'Create Department' to add one."
              : "No departments match your search query."}
          </p>
        </div>
      )}

      {/* DEPARTMENTS TABLE VIEW */}
      {filteredDepartments.length > 0 && viewMode === "table" && (
        <div className="pro-table-wrapper">
          <div className="pro-table-scroll">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-info">Department Name</th>
                  <th className="col-dept">Email</th>
                  <th className="col-date" style={{ textAlign: "center" }}>Created Date</th>
                  <th className="col-status" style={{ textAlign: "center" }}>
                    Assigned
                  </th>
                  <th className="col-action" style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.map((dept) => {
                  const assignedCount = issues.filter(
                    (i) =>
                      (typeof i.department === "object" && i.department !== null
                        ? i.department._id
                        : i.department) === dept._id
                  ).length;

                  return (
                    <tr key={dept._id}>
                      <td className="col-id">
                        <span className="id-badge">#{dept._id.slice(-6)}</span>
                      </td>

                      <td className="col-info">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span className="table-title-main" title={dept.name}>
                            {dept.name}
                          </span>
                        </div>
                      </td>

                      <td className="col-dept">
                        {dept.email ? (
                          <span style={{ fontSize: "12.5px", color: "#38bdf8", fontWeight: 500 }}>
                            {dept.email}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Not configured</span>
                        )}
                      </td>

                      <td className="col-date" style={{ textAlign: "center" }}>
                        {dept.createdAt
                          ? new Date(dept.createdAt).toLocaleDateString()
                          : "Active"}
                      </td>

                      <td className="col-status" style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: "rgba(56, 189, 248, 0.12)",
                            color: "#38bdf8",
                            fontWeight: 700,
                            fontSize: "12px",
                            border: "1px solid rgba(56, 189, 248, 0.25)",
                          }}
                        >
                          {assignedCount}
                        </span>
                      </td>

                      <td className="col-action">
                        <div className="table-action-icons">
                          <button
                            className="btn-action-icon btn-view-icon"
                            onClick={() => onViewDept(dept)}
                            title="View Department Details"
                            type="button"
                          >
                            👁️
                          </button>
                          <button
                            className="btn-action-icon btn-edit-icon"
                            onClick={() => onEditDept(dept)}
                            title="Edit Department"
                            type="button"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action-icon btn-delete-icon"
                            onClick={() => onDeleteDept(dept._id, dept.name)}
                            title="Delete Department"
                            type="button"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENTS CARDS GRID VIEW */}
      {filteredDepartments.length > 0 && viewMode === "cards" && (
        <div className="dashboard-cards-grid">
          {paginatedDepartments.map((dept) => {
            const theme = getDeptTheme(dept.name);
            const deptIssues = issues.filter(
              (i) =>
                (typeof i.department === "object" && i.department !== null
                  ? i.department._id
                  : i.department) === dept._id
            );
            const totalComplaints = deptIssues.length;
            const pendingCount = deptIssues.filter(
              (i) => (!i.status || i.status === "Pending" || i.status === "Assigned") && !i.resolvedPhoto
            ).length;
            const inProgressCount = deptIssues.filter(
              (i) => i.status === "In Progress" && !i.resolvedPhoto
            ).length;
            const resolvedCount = deptIssues.filter(
              (i) => i.status === "Resolved" || !!i.resolvedPhoto
            ).length;

            const resolvedPct = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;
            const inProgressPct = totalComplaints > 0 ? Math.round((inProgressCount / totalComplaints) * 100) : 0;
            const pendingPct = totalComplaints > 0 ? Math.max(0, 100 - resolvedPct - inProgressPct) : 0;

            return (
              <div
                className="dept-bento-card"
                key={dept._id}
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
                    <div className="dept-bento-icon-wrapper">
                      <span>{theme.icon}</span>
                    </div>
                    <div className="dept-bento-badges">
                      <span className="dept-bento-id">#{dept._id.slice(-6)}</span>
                    </div>
                  </div>
                  <h3 className="dept-bento-title" title={dept.name}>
                    {dept.name}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="dept-bento-body">
                  <p className="dept-bento-desc" title={dept.description}>
                    {dept.description || "Official municipal authority managing citizen complaints and infrastructure."}
                  </p>

                  {/* Resolution Efficiency Progress Tracker */}
                  <div className="dept-bento-resolution-wrap">
                    <div className="dept-bento-resolution-header">
                      <span className="dept-bento-res-label">Resolution Efficiency</span>
                      <span className="dept-bento-res-rate">
                        {resolvedPct}% Resolved
                      </span>
                    </div>
                    <div className="dept-bento-progress-track">
                      {resolvedPct > 0 && (
                        <div
                          className="dept-bento-progress-bar bar-resolved"
                          style={{ width: `${resolvedPct}%` }}
                          title={`${resolvedCount} Resolved`}
                        />
                      )}
                      {inProgressPct > 0 && (
                        <div
                          className="dept-bento-progress-bar bar-progress"
                          style={{ width: `${inProgressPct}%` }}
                          title={`${inProgressCount} In Work`}
                        />
                      )}
                      {pendingPct > 0 && (
                        <div
                          className="dept-bento-progress-bar bar-pending"
                          style={{ width: `${pendingPct}%` }}
                          title={`${pendingCount} Pending`}
                        />
                      )}
                    </div>
                    <div className="dept-bento-resolution-legend">
                      <span className="dept-legend-item">
                        <span className="dept-legend-dot dot-resolved" /> {resolvedCount} Resolved
                      </span>
                      <span className="dept-legend-item">
                        <span className="dept-legend-dot dot-progress" /> {inProgressCount} In Work
                      </span>
                      <span className="dept-legend-item">
                        <span className="dept-legend-dot dot-pending" /> {pendingCount} Pending
                      </span>
                    </div>
                  </div>

                  {/* Official Contact Info */}
                  <div className="dept-bento-email-strip">
                    <span>✉️</span>
                    <span className="dept-bento-email-text">{dept.email || "No email registered"}</span>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="dept-bento-footer">
                  <span className="dept-bento-date">
                    📅 {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "Active"}
                  </span>
                  <div className="dept-bento-actions">
                    <button
                      className="btn-bento-action btn-bento-primary"
                      onClick={() => onViewDept(dept)}
                      title="Inspect Department Details"
                      type="button"
                    >
                      👁️ 
                    </button>
                    <button
                      className="btn-bento-action btn-bento-edit"
                      onClick={() => onEditDept(dept)}
                      title="Edit Department"
                      type="button"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-bento-action btn-bento-delete"
                      onClick={() => onDeleteDept(dept._id, dept.name)}
                      title="Delete Department"
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

      {/* Departments Pagination */}
      {filteredDepartments.length > 0 && (
        <Pagination
          currentPage={departmentsPage}
          totalPages={totalDepartmentsPages}
          totalItems={filteredDepartments.length}
          pageSize={departmentsPageSize}
          onPageChange={setDepartmentsPage}
          onPageSizeChange={setDepartmentsPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </>
  );
}
