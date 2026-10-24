import Pagination from "../Pagination";
import { getDeptIcon } from "../../utils/constants";

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
          <div className="empty-state-icon">🏢</div>
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
                  <th className="col-date">Created Date</th>
                  <th className="col-status" style={{ textAlign: "center" }}>
                    Assigned
                  </th>
                  <th className="col-action">Actions</th>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "20px" }}>{getDeptIcon(dept.name)}</span>
                          <span className="table-title-main" title={dept.name}>
                            {dept.name}
                          </span>
                        </div>
                      </td>

                      <td className="col-dept">
                        {dept.email ? (
                          <span style={{ fontSize: "12.5px", color: "#38bdf8", fontWeight: 500 }}>
                            📧 {dept.email}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Not configured</span>
                        )}
                      </td>

                      <td className="col-date">
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
            const assignedCount = issues.filter(
              (i) =>
                (typeof i.department === "object" && i.department !== null
                  ? i.department._id
                  : i.department) === dept._id
            ).length;

            return (
              <div className="dashboard-card" key={dept._id}>
                <div className="card-top-row">
                  <span className="id-badge">#{dept._id.slice(-6)}</span>
                  <span
                    className="category-pill"
                    style={{
                      background: "rgba(168, 85, 247, 0.15)",
                      color: "#c084fc",
                      borderColor: "rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    <span>{getDeptIcon(dept.name)}</span> Department
                  </span>
                </div>

                <h3 className="card-title" title={dept.name}>
                  {dept.name}
                </h3>

                <p className="card-description">
                  {dept.description || "No description provided."}
                </p>

                <div className="card-meta-chips-row">
                  {dept.email && (
                    <span className="meta-chip">📧 {dept.email}</span>
                  )}
                  <span className="meta-chip">
                    📋 {assignedCount} Complaints
                  </span>
                </div>

                <div className="card-controls-footer">
                  <span className="card-date">
                    {dept.createdAt
                      ? new Date(dept.createdAt).toLocaleDateString()
                      : "Active"}
                  </span>
                  <div className="table-action-icons">
                    <button
                      className="btn-action-icon btn-view-icon"
                      onClick={() => onViewDept(dept)}
                      title="View Details"
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
