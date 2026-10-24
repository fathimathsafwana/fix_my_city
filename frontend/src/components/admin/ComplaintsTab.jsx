import Pagination from "../Pagination";
import { getDeptIcon, getStatusClass, getCategoryIcon } from "../../utils/constants";

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
  users = [],
}) {
  return (
    <>
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
            <label className="toolbar-control-label" htmlFor="dept-select-filter">
              <span className="toolbar-icon">🏢</span> Department:
            </label>
            <select
              id="dept-select-filter"
              className="toolbar-select toolbar-select-dept"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              title="Filter complaints by department or unassigned"
            >
              <option value="All">🌐 All Departments ({issues.length})</option>
              <option value="Unassigned">
                ⚠️ Unassigned Complaints ({deptIssueCounts.unassigned || 0})
              </option>
              <optgroup label="Municipal Departments">
                {departments.map((dept) => {
                  const count = deptIssueCounts[String(dept._id)] || 0;
                  return (
                    <option key={dept._id} value={String(dept._id)}>
                      {getDeptIcon(dept.name)} {dept.name} ({count})
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          <div className="toolbar-control-group">
            <label className="toolbar-control-label" htmlFor="status-select-filter">
              <span className="toolbar-icon">⚡</span> Status:
            </label>
            <select
              id="status-select-filter"
              className="toolbar-select toolbar-select-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter complaints by workflow status"
            >
              <option value="All">📊 All Statuses ({issues.length})</option>
              <option value="Pending">⏳ Pending ({complaintStats.pending || 0})</option>
              <option value="Assigned">📋 Assigned ({complaintStats.assigned || 0})</option>
              <option value="Rejected">❌ Rejected ({complaintStats.rejected || 0})</option>
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
          <div className="empty-state-icon">📂</div>
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
                  <th className="col-dept">Department</th>
                  <th className="col-date">Reported</th>
                  <th className="col-status">Status</th>
                  <th className="col-action">Quick Actions</th>
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
                        <span className="id-badge">#{issue._id.slice(-6)}</span>
                      </td>

                      <td className="col-info">
                        <div className="table-title-main" title={issue.title}>
                          {issue.title}
                        </div>
                      </td>

                      <td className="col-dept">
                        {deptObj ? (
                          <span className="dept-tag">
                            {getDeptIcon(deptObj.name)} {deptObj.name}
                          </span>
                        ) : (
                          <span className="unassigned-tag">⚠️ Unassigned</span>
                        )}
                      </td>

                      <td className="col-date">
                        {issue.createdAt
                          ? new Date(issue.createdAt).toLocaleDateString()
                          : "Recent"}
                      </td>

                      <td className="col-status">
                        <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                          <span className="status-dot"></span>
                          {!issue.status || issue.status === "Submitted"
                            ? "Pending"
                            : issue.status}
                        </span>
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

      {/* CARDS GRID VIEW */}
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

            return (
              <div className="dashboard-card" key={issue._id}>
                <div className="card-top-row">
                  <span className="id-badge">#{issue._id.slice(-6)}</span>
                  <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                    <span className="status-dot"></span>
                    {!issue.status || issue.status === "Submitted"
                      ? "Pending"
                      : issue.status}
                  </span>
                </div>

                <h3 className="card-title" title={issue.title}>
                  {issue.title}
                </h3>

                <div className="card-meta-chips-row">
                  <span className="category-pill">
                    <span className="category-icon">{getCategoryIcon(issue.category)}</span>
                    {issue.category || "General"}
                  </span>
                  <span className="meta-chip">👤 {citizenName}</span>
                  {deptObj ? (
                    <span className="meta-chip">
                      {getDeptIcon(deptObj.name)} {deptObj.name}
                    </span>
                  ) : (
                    <span className="meta-chip unassigned">⚠️ Unassigned</span>
                  )}
                </div>

                <p className="card-description">
                  {issue.description || "No description provided."}
                </p>

                <div className="card-controls-footer">
                  <span className="card-date">
                    {issue.createdAt
                      ? new Date(issue.createdAt).toLocaleDateString()
                      : "Recent"}
                  </span>
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
