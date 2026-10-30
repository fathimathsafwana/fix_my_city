import Pagination from "../Pagination";
import { getStatusClass, getCategoryIcon, getIssueCategory, getPhotoUrl } from "../../utils/constants";
import { API_BASE_URL } from "../../config";
import { useToast } from "../../context/useToast";

const getComplaintTheme = (issue = {}, deptName = "") => {
  const status = issue.status || "Pending";
  const deptLower = (deptName || "").toLowerCase();

  let categoryIcon = "🏢";
  if (deptLower.includes("sanitat") || deptLower.includes("waste") || deptLower.includes("garbage")) categoryIcon = "🗑️";
  else if (deptLower.includes("road") || deptLower.includes("pothole") || deptLower.includes("infrastruct")) categoryIcon = "🚧";
  else if (deptLower.includes("water") || deptLower.includes("drain") || deptLower.includes("sewer")) categoryIcon = "🚰";
  else if (deptLower.includes("electr") || deptLower.includes("light") || deptLower.includes("power")) categoryIcon = "⚡";
  else if (deptLower.includes("plumb")) categoryIcon = "🔧";
  else if (deptLower.includes("safe") || deptLower.includes("police") || deptLower.includes("fire")) categoryIcon = "🚨";

  if (status === "Resolved" || !!issue.resolvedPhoto) {
    return {
      icon: categoryIcon,
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
      border: "rgba(16, 185, 129, 0.35)",
      borderHover: "rgba(16, 185, 129, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(16, 185, 129, 0.15)",
      statusLabel: "Resolved",
      statusClass: "status-resolved",
    };
  }
  if (status === "In Progress") {
    return {
      icon: categoryIcon,
      accent: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.25)",
      border: "rgba(56, 189, 248, 0.35)",
      borderHover: "rgba(56, 189, 248, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(56, 189, 248, 0.15)",
      statusLabel: "In Progress",
      statusClass: "status-in-progress",
    };
  }
  if (status === "Verified") {
    return {
      icon: categoryIcon,
      accent: "#818cf8",
      glow: "rgba(129, 140, 248, 0.25)",
      border: "rgba(129, 140, 248, 0.35)",
      borderHover: "rgba(129, 140, 248, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(129, 140, 248, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(129, 140, 248, 0.15)",
      statusLabel: "Verified",
      statusClass: "status-verified",
    };
  }
  if (status === "Rejected") {
    return {
      icon: categoryIcon,
      accent: "#ef4444",
      glow: "rgba(239, 68, 68, 0.25)",
      border: "rgba(239, 68, 68, 0.35)",
      borderHover: "rgba(239, 68, 68, 0.6)",
      heroBg: "linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
      pillBg: "rgba(239, 68, 68, 0.15)",
      statusLabel: "Rejected",
      statusClass: "status-rejected",
    };
  }
  return {
    icon: categoryIcon,
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.25)",
    border: "rgba(245, 158, 11, 0.35)",
    borderHover: "rgba(245, 158, 11, 0.6)",
    heroBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(13, 17, 26, 0.4) 100%)",
    pillBg: "rgba(245, 158, 11, 0.15)",
    statusLabel: "Pending",
    statusClass: "status-pending",
  };
};

export default function ComplaintsTab({
  issues = [],
  filteredIssues = [],
  paginatedIssues = [],
  departments = [],
  deptIssueCounts = {},
  complaintStats = {},
  loading = false,
  searchQuery = "",
  setSearchQuery,
  statusFilter = "All",
  setStatusFilter,
  departmentFilter = "All",
  setDepartmentFilter,
  viewMode = "table",
  setViewMode,
  complaintsPage = 1,
  setComplaintsPage,
  complaintsPageSize = 5,
  setComplaintsPageSize,
  totalComplaintsPages = 1,
  onViewIssue,
  onEditIssue,
  onDeleteIssue,
  onInspectPhoto,
  users = [],
}) {
  const { showToast } = useToast();
  return (
    <>
      {/* Complaints Status Cards Grid */}
      <div className="stats-grid complaints-stats-grid">
        <div
          className={`stat-card stat-card-total ${statusFilter === "All" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter("All")}
          title="Click to view all complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">📑</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.total || 0}</span>
            <span className="stat-label">Total Complaints</span>
          </div>
        </div>

        <div
          className={`stat-card stat-card-pending ${statusFilter === "Pending" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "All" : "Pending")}
          title="Click to filter Pending complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.pending || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div
          className={`stat-card stat-card-assigned ${statusFilter === "Assigned" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Assigned" ? "All" : "Assigned")}
          title="Click to filter Assigned complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.assigned || 0}</span>
            <span className="stat-label">Assigned</span>
          </div>
        </div>

        <div
          className={`stat-card stat-card-progress ${statusFilter === "In Progress" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "In Progress" ? "All" : "In Progress")}
          title="Click to filter In Progress complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.inProgress || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div
          className={`stat-card stat-card-resolved ${statusFilter === "Resolved" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Resolved" ? "All" : "Resolved")}
          title="Click to filter Resolved complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.resolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        <div
          className={`stat-card stat-card-rejected ${statusFilter === "Rejected" ? "stat-active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "Rejected" ? "All" : "Rejected")}
          title="Click to filter Rejected complaints"
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <span className="stat-value">{complaintStats.rejected || 0}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Complaints Center Filter & Controls Toolbar */}
      <div className="complaints-center-toolbar">
        <div className="toolbar-left-controls">
          {/* Search Complaints */}
          <div className="toolbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search complaints, ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-control-group">
            <label className="toolbar-control-label" htmlFor="status-select-filter">
              Status:
            </label>
            <select
              id="status-select-filter"
              className="toolbar-select toolbar-select-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter complaints by workflow status"
            >
              <option value="All">📊 All Statuses</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Assigned">🏢 Assigned</option>
              <option value="In Progress">🔧 In Progress</option>
              <option value="Resolved">✅ Resolved</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="toolbar-control-group">
            <label className="toolbar-control-label" htmlFor="dept-select-filter">
              Department:
            </label>
            <select
              id="dept-select-filter"
              className="toolbar-select toolbar-select-dept"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              title="Filter complaints by department or unassigned"
            >
              <option value="All">🌐 All Departments</option>
              <option value="Unassigned">
                ⚠️ Unassigned Complaints
              </option>
              <optgroup label="Municipal Departments">
                {departments.map((dept) => (
                  <option key={dept._id} value={String(dept._id)}>
                    {dept.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="toolbar-right-meta">
          {/* Table / Cards View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Professional Table View"
              type="button"
            >
              📋
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
              type="button"
            >
              🗂️
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading complaints...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredIssues.length === 0 && (
        <div className="no-issues-placeholder">
          <h3>No Complaints Found</h3>
          <p>
            {issues.length === 0
              ? "No civic complaints have been registered in the system yet."
              : "No complaints match your active filter or search query."}
          </p>
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && filteredIssues.length > 0 && viewMode === "table" && (
        <div className="pro-table-wrapper">
          <div className="pro-table-scroll">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="col-id">Complaint ID</th>
                  <th className="col-info">Title</th>
                  <th className="col-status">Status</th>
                  <th className="col-date" style={{ textAlign: "center" }}>Reported</th>
                  <th className="col-dept">Department</th>
                  <th className="col-action" style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIssues.map((issue) => {
                  const deptObj = departments.find(
                    (d) =>
                      d._id ===
                      (typeof issue.department === "object" && issue.department !== null
                        ? issue.department._id
                        : issue.department)
                  );

                  return (
                    <tr key={issue._id}>
                      <td className="col-id">
                        <span className="id-badge">#{(issue.trackingId || issue._id).slice(0, 10)}</span>
                      </td>

                      <td className="col-info">
                        <div className="table-title-main" title={issue.title}>
                          {issue.title}
                        </div>
                      </td>

                      <td className="col-status">
                        <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                          <span className="status-dot"></span>
                          {!issue.status || issue.status === "Submitted"
                            ? "Pending"
                            : issue.status}
                        </span>
                      </td>

                      <td className="col-date" style={{ textAlign: "center" }}>
                        {issue.createdAt
                          ? new Date(issue.createdAt).toLocaleDateString()
                          : "Recent"}
                      </td>

                      <td className="col-dept">
                        {deptObj ? (
                          <span className="dept-tag">
                            {deptObj.name}
                          </span>
                        ) : (
                          <span className="unassigned-tag">Unassigned</span>
                        )}
                      </td>

                      <td className="col-action">
                        <div className="table-action-icons">
                          <button
                            className="btn-action-icon btn-view-icon"
                            onClick={() => onViewIssue(issue)}
                            title="Inspect Complaint Details"
                            type="button"
                          >
                            👁️
                          </button>
                          {issue.status !== "Resolved" ? (
                            <>
                              <button
                                className="btn-action-icon btn-edit-icon"
                                onClick={() => onEditIssue(issue)}
                                title="Edit Complaint"
                                type="button"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-action-icon btn-delete-icon"
                                onClick={() => onDeleteIssue(issue._id, issue.title)}
                                title="Delete Complaint"
                                type="button"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-action-icon btn-edit-icon"
                                disabled
                                title="Resolved complaints cannot be edited"
                                type="button"
                                style={{ opacity: 0.35, cursor: "not-allowed" }}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-action-icon btn-delete-icon"
                                disabled
                                title="Resolved complaints cannot be deleted"
                                type="button"
                                style={{ opacity: 0.35, cursor: "not-allowed" }}
                              >
                                🗑️
                              </button>
                            </>
                          )}
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

      {/* COMPLAINTS BENTO CARDS GRID VIEW */}
      {!loading && filteredIssues.length > 0 && viewMode === "cards" && (
        <div className="dashboard-cards-grid">
          {paginatedIssues.map((issue) => {
            const citizenObj =
              typeof issue.user === "object" && issue.user !== null
                ? issue.user
                : users.find((u) => u._id === issue.user);
            const citizenName = citizenObj?.name || issue.userName || "Citizen";

            const deptObj = departments.find(
              (d) =>
                d._id ===
                (typeof issue.department === "object" && issue.department !== null
                  ? issue.department._id
                  : issue.department)
            );
            const deptName = deptObj ? deptObj.name : getIssueCategory(issue, departments);
            const theme = getComplaintTheme(issue, deptName);
            const trackId = (issue.trackingId || String(issue._id)).slice(0, 10);

            return (
              <div
                className="dept-bento-card complaint-bento-card"
                key={issue._id}
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
                      <span
                        className="dept-bento-id"
                        style={{ cursor: "pointer" }}
                        title="Click to copy Tracking ID"
                        onClick={() => {
                          navigator.clipboard.writeText(trackId);
                          if (showToast) showToast("Tracking ID copied!");
                        }}
                      >
                        #{trackId}
                      </span>
                      <span className={`pro-status-badge ${theme.statusClass}`}>
                        <span className="status-dot"></span>
                        {theme.statusLabel}
                      </span>
                    </div>
                  </div>

                  <h3 className="dept-bento-title" title={issue.title}>
                    {issue.title}
                  </h3>
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>👤 {citizenName}</span>
                    <span>•</span>
                    <span style={{ color: theme.accent, fontWeight: 600 }}>🏛️ {deptName}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="dept-bento-body">
                  <p className="dept-bento-desc" title={issue.description}>
                    {issue.description || "No detailed description provided."}
                  </p>

                  {/* Photos Preview Frame (Problem Photo & Resolution Proof) */}
                  {(issue.photo || issue.resolvedPhoto) ? (
                    <div className="dept-card-photos">
                      {issue.photo && (
                        <div
                          className="dept-photo-frame"
                          style={{ height: issue.resolvedPhoto ? "115px" : "140px" }}
                          onClick={() =>
                            onInspectPhoto &&
                            onInspectPhoto({
                              url: getPhotoUrl(issue.photo, API_BASE_URL),
                              title: issue.title || "Reported Problem Photo",
                              type: "Reported Problem Photo",
                            })
                          }
                          title="Click to inspect problem photo"
                        >
                          <img
                            src={getPhotoUrl(issue.photo, API_BASE_URL)}
                            alt="Problem evidence"
                            loading="lazy"
                            style={{ height: issue.resolvedPhoto ? "115px" : "140px" }}
                          />
                          <span className="dept-photo-tag problem">📷 Problem</span>
                        </div>
                      )}
                      {issue.resolvedPhoto && (
                        <div
                          className="dept-photo-frame"
                          style={{
                            height: issue.photo ? "115px" : "140px",
                            borderColor: "rgba(16, 185, 129, 0.4)",
                          }}
                          onClick={() =>
                            onInspectPhoto &&
                            onInspectPhoto({
                              url: getPhotoUrl(issue.resolvedPhoto, API_BASE_URL),
                              title: issue.title || "Completed Work Proof",
                              type: "Completed Work Proof",
                            })
                          }
                          title="Click to inspect resolution proof"
                        >
                          <img
                            src={getPhotoUrl(issue.resolvedPhoto, API_BASE_URL)}
                            alt="Resolution proof"
                            loading="lazy"
                            style={{ height: issue.photo ? "115px" : "140px" }}
                          />
                          <span className="dept-photo-tag resolved">✅ Resolved</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="dept-bento-email-strip">
                      <span>📍</span>
                      <span className="dept-bento-email-text" style={{ color: "#94a3b8" }}>
                        {issue.location || "City Location Verified"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Bar */}
                <div className="dept-bento-footer">
                  <span className="dept-bento-date">
                    📅 {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                  <div className="dept-bento-actions">
                    <button
                      className="btn-bento-action btn-bento-primary"
                      onClick={() => onViewIssue(issue)}
                      title="Inspect Complaint Details"
                      type="button"
                    >
                      👁️
                    </button>
                    {issue.status !== "Resolved" ? (
                      <>
                        <button
                          className="btn-bento-action btn-bento-edit"
                          onClick={() => onEditIssue(issue)}
                          title="Edit Complaint"
                          type="button"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-bento-action btn-bento-delete"
                          onClick={() => onDeleteIssue(issue._id, issue.title)}
                          title="Delete Complaint"
                          type="button"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-bento-action btn-bento-edit"
                          disabled
                          title="Resolved complaints cannot be edited"
                          type="button"
                          style={{ opacity: 0.35, cursor: "not-allowed" }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-bento-action btn-bento-delete"
                          disabled
                          title="Resolved complaints cannot be deleted"
                          type="button"
                          style={{ opacity: 0.35, cursor: "not-allowed" }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredIssues.length > 0 && (
        <Pagination
          currentPage={complaintsPage}
          totalPages={totalComplaintsPages}
          totalItems={filteredIssues.length}
          pageSize={complaintsPageSize}
          onPageChange={setComplaintsPage}
          onPageSizeChange={setComplaintsPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </>
  );
}
