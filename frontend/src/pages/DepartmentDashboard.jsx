import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/useToast";
import Pagination from "../components/Pagination";

function DepartmentDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && u.department) {
        return typeof u.department === "object" ? u.department._id : u.department;
      }
    } catch {}
    return "";
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState("table");

  // Lightbox Modal for high-res photo inspection
  const [lightboxImage, setLightboxImage] = useState(null);

  // Sidebar controls
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Completed work photo upload states
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState({});

  // Current logged in user from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && (u.name === "Electrical Department Officer" || !u.name)) {
        u.name = "Department Officer";
        localStorage.setItem("user", JSON.stringify(u));
      }
      return u;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    showToast("Signed out successfully.", "info");
    navigate("/login");
  };

  useEffect(() => {
    fetchIssues();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (currentUser?.department && !selectedDepartment) {
      const deptId =
        typeof currentUser.department === "object"
          ? currentUser.department._id
          : currentUser.department;
      if (deptId) setSelectedDepartment(String(deptId));
    }
  }, [currentUser, selectedDepartment]);

  const getAuthHeaders = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user && user.id) {
        return { "user-id": user.id };
      }
    } catch {
      // ignore
    }
    return {};
  };

  const fetchIssues = () => {
    fetch("http://localhost:5000/api/issues")
      .then((response) => response.json())
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching issues:", error);
        setLoading(false);
      });
  };

  const fetchDepartments = () => {
    fetch("http://localhost:5000/api/departments")
      .then((response) => response.json())
      .then((data) => {
        const depts = Array.isArray(data) ? data : [];
        setDepartments(depts);
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  };

  const handleStatusChange = async (issueId, newStatus) => {
    setUpdatingId(issueId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/issues/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId ? (data.issue ? data.issue : { ...item, status: newStatus }) : item
        )
      );

      showToast(`Status successfully updated to "${newStatus}"!`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update complaint status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePhotoSelect = (issueId, file) => {
    if (!file) return;
    setSelectedPhotos((prev) => ({ ...prev, [issueId]: file }));
    setPhotoPreviews((prev) => ({
      ...prev,
      [issueId]: URL.createObjectURL(file),
    }));
  };

  const handleCancelPhotoSelect = (issueId) => {
    setSelectedPhotos((prev) => {
      const copy = { ...prev };
      delete copy[issueId];
      return copy;
    });
    setPhotoPreviews((prev) => {
      const copy = { ...prev };
      delete copy[issueId];
      return copy;
    });
  };

  const handleUploadResolvedPhoto = async (issueId) => {
    const file = selectedPhotos[issueId];
    if (!file) {
      showToast("Please select a completed work photo first.", "warning");
      return;
    }

    setUploadingPhotoId(issueId);
    try {
      const formData = new FormData();
      formData.append("resolvedPhoto", file);
      formData.append("status", "Resolved");

      const response = await fetch(
        `http://localhost:5000/api/issues/${issueId}/resolved-photo`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload completed work photo");
      }

      const data = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId
            ? data.issue
              ? data.issue
              : { ...item, resolvedPhoto: data.resolvedPhoto, status: "Resolved" }
            : item
        )
      );

      handleCancelPhotoSelect(issueId);
      showToast("Completed work photo uploaded & issue marked as Resolved!", "success");
    } catch (error) {
      console.error("Error uploading resolved photo:", error);
      showToast("Failed to upload completed work photo.", "error");
    } finally {
      setUploadingPhotoId(null);
    }
  };

  // Live count of issues assigned to each department
  const deptIssueCounts = useMemo(() => {
    const counts = {};
    issues.forEach((issue) => {
      const deptId =
        typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department;
      if (deptId) {
        const key = String(deptId);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [issues]);

  // Selected Department Object
  const currentDept = useMemo(() => {
    return departments.find((d) => String(d._id) === String(selectedDepartment));
  }, [departments, selectedDepartment]);

  // Filter issues based on department, search, and status
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const issueDeptId =
        typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department;

      const matchesDept = selectedDepartment
        ? String(issueDeptId) === String(selectedDepartment)
        : true;

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Assigned"
          ? issue.status === "Assigned" || issue.status === "Submitted" || issue.status === "Verified"
          : issue.status === statusFilter;

      const matchesSearch =
        searchQuery === "" ||
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [issues, selectedDepartment, statusFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, statusFilter, searchQuery]);

  // Paginated Complaints
  const totalDeptPages = Math.ceil(filteredIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, currentPage, pageSize]);

  // Statistics for Department
  const stats = useMemo(() => {
    const relevant = selectedDepartment
      ? issues.filter((i) => {
          const deptId =
            typeof i.department === "object" && i.department !== null
              ? i.department._id
              : i.department;
          return String(deptId) === String(selectedDepartment);
        })
      : issues;

    return {
      total: relevant.length,
      inProgress: relevant.filter((i) => i.status === "In Progress").length,
      assigned: relevant.filter((i) => i.status !== "In Progress" && i.status !== "Resolved").length,
      resolved: relevant.filter((i) => i.status === "Resolved").length,
    };
  }, [issues, selectedDepartment]);

  const getCategoryIcon = (category) => {
    if (!category) return "⚠️";
    const lower = category.toLowerCase();
    if (lower.includes("road") || lower.includes("pothole")) return "🚧";
    if (lower.includes("light")) return "💡";
    if (lower.includes("garbage") || lower.includes("waste")) return "🗑️";
    if (lower.includes("water")) return "🚰";
    if (lower.includes("drainage")) return "🌊";
    return "📍";
  };

  const getDeptIcon = (name) => {
    if (!name) return "🏢";
    const lower = name.toLowerCase();
    if (lower.includes("electr") || lower.includes("light")) return "⚡";
    if (lower.includes("water") || lower.includes("drain")) return "🚰";
    if (lower.includes("road") || lower.includes("infra")) return "🚧";
    if (lower.includes("sanitat") || lower.includes("waste") || lower.includes("garbage")) return "🗑️";
    return "🏢";
  };

  const getStatusClass = (status) => {
    return `status-${(status || "submitted").toLowerCase().replace(/\s+/g, "-")}`;
  };

  const getPhotoUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  return (
    <div className="dept-sidebar-layout">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="dept-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Lightbox Photo Preview Modal */}
      {lightboxImage && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-lightbox-close-btn"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.title || "Proof"} />
            <div className="image-lightbox-caption">
              {lightboxImage.title} • {lightboxImage.type}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          LEFT SIDEBAR NAVIGATION
          ========================================================= */}
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
              <div className="sidebar-logo-text-group">
                <span className="sidebar-logo-text">FixMyCity</span>
                <span className="sidebar-logo-sub">Operations</span>
              </div>
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

        {/* Officer Profile Badge */}
        <div className="dept-officer-profile">
          <div className="officer-avatar" title={currentUser?.name || "Department Officer"}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "D"}
            <span className="officer-online-dot" title="Active On Duty" />
          </div>
          {!isCollapsed && (
            <div className="officer-info">
              <span className="officer-name">
                {currentUser?.name || "Department Officer"}
              </span>
              <span className="officer-role-tag">Department Portal</span>
              <span className="officer-email">
                {currentUser?.email || "department@gmail.com"}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="dept-sidebar-scroll">
          <div className="dept-nav-group">
            {!isCollapsed && (
              <div className="dept-nav-group-title">DEPARTMENT MODULES</div>
            )}

            <button
              className="dept-nav-item active"
              onClick={() => {
                setSelectedDepartment("");
                setStatusFilter("All");
                setSearchQuery("");
                setIsMobileOpen(false);
              }}
              title="Complaints Center - View All Complaints"
            >
              <span className="nav-item-icon">📋</span>
              {!isCollapsed && (
                <span className="nav-item-label">Complaints Center</span>
              )}
              {!isCollapsed && (
                <span className="nav-item-badge">{issues.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="dept-sidebar-footer">
          <Link
            to="/"
            className="sidebar-action-btn"
            title="Return to Public Portal Home"
          >
            <span>🏠</span>
            {!isCollapsed && <span>Public Portal</span>}
          </Link>
          <button
            className="sidebar-action-btn logout"
            onClick={handleLogout}
            title="Sign out"
          >
            <span>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          RIGHT MAIN CONTENT AREA
          ========================================================= */}
      <main className="dept-main-content">
        {/* Sticky Top Bar */}
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
                {currentDept ? (
                  <>
                    <span className="dept-head-icon">
                      {getDeptIcon(currentDept.name)}
                    </span>
                    <span>{currentDept.name}</span>
                  </>
                ) : (
                  <>
                    <span className="accent-text">Department</span> Operations Center
                  </>
                )}
              </h1>
              <p className="dept-page-subheading">
                {currentDept
                  ? `Viewing issues assigned to ${currentDept.name} • ${stats.total} complaints`
                  : `All municipal departments overview • ${stats.total} total complaints`}
              </p>
            </div>
          </div>

          <div className="dept-topbar-right">
            {/* Search Input */}
            <div className="dept-topbar-search">
              <span className="topbar-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search complaints, ID, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              className="btn-refresh"
              onClick={() => {
                setLoading(true);
                fetchIssues();
                fetchDepartments();
              }}
              title="Refresh complaint data"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="dept-content-body">
          {/* Interactive Metric Cards Strip */}
          <div className="stats-grid">
            <div
              className={`stat-card ${statusFilter === "All" ? "stat-active" : ""}`}
              onClick={() => setStatusFilter("All")}
              title="Click to view all complaints"
              style={{ cursor: "pointer" }}
            >
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Assigned Issues</span>
              </div>
            </div>

            <div
              className={`stat-card stat-card-verified ${
                statusFilter === "Assigned" ? "stat-active" : ""
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === "Assigned" ? "All" : "Assigned")
              }
              title="Click to filter pending action complaints"
              style={{ cursor: "pointer" }}
            >
              <div className="stat-icon">📥</div>
              <div className="stat-info">
                <span className="stat-value">{stats.assigned}</span>
                <span className="stat-label">Pending Action</span>
              </div>
            </div>

            <div
              className={`stat-card stat-card-progress ${
                statusFilter === "In Progress" ? "stat-active" : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "In Progress" ? "All" : "In Progress"
                )
              }
              title="Click to filter complaints in progress"
              style={{ cursor: "pointer" }}
            >
              <div className="stat-icon">🔧</div>
              <div className="stat-info">
                <span className="stat-value">{stats.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>

            <div
              className={`stat-card stat-card-resolved ${
                statusFilter === "Resolved" ? "stat-active" : ""
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === "Resolved" ? "All" : "Resolved")
              }
              title="Click to filter resolved complaints"
              style={{ cursor: "pointer" }}
            >
              <div className="stat-icon">✨</div>
              <div className="stat-info">
                <span className="stat-value">{stats.resolved}</span>
                <span className="stat-label">Resolved</span>
              </div>
            </div>
          </div>

          {/* Department Operations Filter & Controls Toolbar - Top of Table */}
          <div className="complaints-center-toolbar">
            <div className="toolbar-left-controls">
              <div className="toolbar-control-group">
                <label className="toolbar-control-label" htmlFor="dept-select-filter">
                  <span className="toolbar-icon">🏢</span> Department:
                </label>
                <select
                  id="dept-select-filter"
                  className="toolbar-select toolbar-select-dept"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  title="Filter complaints by department"
                >
                  <option value="">🌐 All Departments ({issues.length})</option>
                  {departments.map((dept) => {
                    const count = deptIssueCounts[String(dept._id)] || 0;
                    return (
                      <option key={dept._id} value={String(dept._id)}>
                        {getDeptIcon(dept.name)} {dept.name} ({count})
                      </option>
                    );
                  })}
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
                  <option value="All">📊 All Statuses ({stats.total})</option>
                  <option value="Assigned">📥 Pending Action ({stats.assigned})</option>
                  <option value="In Progress">🔧 In Progress ({stats.inProgress})</option>
                  <option value="Resolved">✨ Resolved ({stats.resolved})</option>
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
                >
                  📋 Table
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="Executive Card Grid"
                >
                  🗂️ Cards
                </button>
              </div>

              {(selectedDepartment || statusFilter !== "All" || searchQuery) && (
                <button
                  className="btn-toolbar-reset"
                  onClick={() => {
                    setSelectedDepartment("");
                    setStatusFilter("All");
                    setSearchQuery("");
                  }}
                  title="Reset all filters to show all complaints"
                >
                  ✕ Reset to All
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="dashboard-loading">
              <div className="spinner"></div>
              <p>Loading department complaints...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredIssues.length === 0 && (
            <div className="dashboard-empty">
              <div className="empty-icon">📂</div>
              <h3>No Complaints Found</h3>
              <p>
                {selectedDepartment
                  ? `No complaints currently match filters for ${
                      currentDept?.name || "this department"
                    }.`
                  : "No complaints found matching the current search or filters."}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "8px",
                }}
              >
                💡 Tip: Admins can assign newly reported issues to departments from the Admin Dashboard.
              </p>
              {(searchQuery || statusFilter !== "All" || selectedDepartment) && (
                <button
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setSelectedDepartment("");
                  }}
                >
                  Show All Complaints
                </button>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 1: PROFESSIONAL DATA TABLE (CLEAN & CONSTRAINED)
              ========================================================= */}
          {!loading && filteredIssues.length > 0 && viewMode === "table" && (
            <div className="pro-table-wrapper">
              <div className="pro-table-scroll">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th className="col-id">Complaint ID</th>
                      <th className="col-info">Category & Title</th>
                      <th className="col-dept">Department</th>
                      <th className="col-loc">Location</th>
                      <th className="col-date">Reported Date</th>
                      <th className="col-photo">Photo Proof</th>
                      <th className="col-status">Current Status</th>
                      <th className="col-action">Action / Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedIssues.map((issue) => {
                      const assignedDept = departments.find(
                        (d) =>
                          d._id ===
                          (typeof issue.department === "object" && issue.department !== null
                            ? issue.department._id
                            : issue.department)
                      );

                      return (
                        <tr
                          key={issue._id}
                          className={
                            updatingId === issue._id || uploadingPhotoId === issue._id
                              ? "row-updating"
                              : ""
                          }
                        >
                          {/* ID */}
                          <td>
                            <span
                              className="td-id-chip"
                              title="Click to copy ID"
                              onClick={() => {
                                navigator.clipboard.writeText(issue._id);
                                showToast("Complaint ID copied!");
                              }}
                            >
                              📋 #{issue._id ? issue._id.slice(-6) : "ID"}
                            </span>
                          </td>

                          {/* Category & Title */}
                          <td>
                            <div className="td-issue-info">
                              <span className="category-pill" style={{ width: "fit-content", padding: "2px 8px", fontSize: "11px" }}>
                                {getCategoryIcon(issue.category)} {issue.category || "General"}
                              </span>
                              <span className="td-issue-title" title={issue.title}>
                                {issue.title}
                              </span>
                              <span className="td-issue-desc" title={issue.description}>
                                {issue.description}
                              </span>
                            </div>
                          </td>

                          {/* Department */}
                          <td>
                            <span className={`dept-badge ${assignedDept ? "assigned" : "unassigned"}`}>
                              {assignedDept ? assignedDept.name : "Not Assigned"}
                            </span>
                          </td>

                          {/* Location */}
                          <td>
                            {(issue.latitude || issue.longitude) ? (
                              <a
                                className="location-link"
                                href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open GPS in Google Maps"
                              >
                                📍 {Number(issue.latitude).toFixed(3)}, {Number(issue.longitude).toFixed(3)} ↗
                              </a>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>No GPS</span>
                            )}
                          </td>

                          {/* Date */}
                          <td>
                            <span className="td-meta-date">
                              {issue.createdAt
                                ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recent"}
                            </span>
                          </td>

                          {/* Photo Proof (Constrained 50x50px) */}
                          <td>
                            <div className="td-photos-cell" style={{ justifyContent: "center" }}>
                              {issue.photo && (
                                <div
                                  className="td-thumb"
                                  title="Citizen Photo - Click to expand"
                                  onClick={() =>
                                    setLightboxImage({
                                      url: getPhotoUrl(issue.photo),
                                      title: issue.title,
                                      type: "Citizen Photo",
                                    })
                                  }
                                >
                                  <img
                                    src={getPhotoUrl(issue.photo)}
                                    alt="Citizen report"
                                  />
                                  <span className="td-thumb-badge">📷</span>
                                </div>
                              )}

                              {issue.resolvedPhoto && (
                                <div
                                  className="td-thumb"
                                  title="Completed Work Photo - Click to expand"
                                  onClick={() =>
                                    setLightboxImage({
                                      url: getPhotoUrl(issue.resolvedPhoto),
                                      title: issue.title,
                                      type: "Completed Work Proof",
                                    })
                                  }
                                  style={{ borderColor: "#10b981" }}
                                >
                                  <img
                                    src={getPhotoUrl(issue.resolvedPhoto)}
                                    alt="Completed proof"
                                  />
                                  <span className="td-thumb-badge" style={{ color: "#10b981" }}>✅</span>
                                </div>
                              )}

                              {!issue.photo && !issue.resolvedPhoto && (
                                <span className="td-no-photo">None</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                              <span className="status-dot"></span>
                              {issue.status || "Submitted"}
                            </span>
                          </td>

                          {/* Action */}
                          <td>
                            <div className="td-action-group">
                              <select
                                className="td-action-select"
                                value={issue.status || "Submitted"}
                                onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                              >
                                <option value="Submitted">Submitted</option>
                                <option value="Verified">Verified</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                              </select>

                              <label
                                htmlFor={`table-file-${issue._id}`}
                                className="view-toggle-btn"
                                style={{
                                  background: "rgba(204, 255, 0, 0.12)",
                                  color: "var(--neon)",
                                  border: "1px solid rgba(204, 255, 0, 0.3)",
                                  padding: "5px 10px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                                title="Upload completed work proof"
                              >
                                📸 {issue.resolvedPhoto ? "Update Proof" : "Proof"}
                              </label>
                              <input
                                id={`table-file-${issue._id}`}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handlePhotoSelect(issue._id, file);
                                    const formData = new FormData();
                                    formData.append("resolvedPhoto", file);
                                    formData.append("status", "Resolved");
                                    setUploadingPhotoId(issue._id);
                                    fetch(`http://localhost:5000/api/issues/${issue._id}/resolved-photo`, {
                                      method: "PUT",
                                      headers: getAuthHeaders(),
                                      body: formData,
                                    })
                                      .then((res) => res.json())
                                      .then((data) => {
                                        setIssues((curr) =>
                                          curr.map((it) =>
                                            it._id === issue._id
                                              ? data.issue || { ...it, resolvedPhoto: data.resolvedPhoto, status: "Resolved" }
                                              : it
                                          )
                                        );
                                        showToast("Completed work proof uploaded & Marked Resolved!", "success");
                                      })
                                      .catch(() => showToast("Failed to upload photo", "error"))
                                      .finally(() => setUploadingPhotoId(null));
                                  }
                                }}
                              />
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

          {/* =========================================================
              VIEW 2: REFINED EXECUTIVE CARDS
              ========================================================= */}
          {!loading && filteredIssues.length > 0 && viewMode === "cards" && (
            <div className="dashboard-cards-grid">
              {paginatedIssues.map((issue) => {
                const assignedDept = departments.find(
                  (d) =>
                    d._id ===
                    (typeof issue.department === "object" && issue.department !== null
                      ? issue.department._id
                      : issue.department)
                );

                return (
                  <div
                    className={`dashboard-card ${
                      updatingId === issue._id || uploadingPhotoId === issue._id
                        ? "card-updating"
                        : ""
                    }`}
                    key={issue._id}
                  >
                    {/* Top Row: Category + Status + ID */}
                    <div className="card-top-bar">
                      <span className="category-pill">
                        <span className="cat-icon">
                          {getCategoryIcon(issue.category)}
                        </span>
                        {issue.category || "General"}
                      </span>

                      <div className="card-top-right-group">
                        <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                          <span className="status-dot"></span>
                          {issue.status || "Submitted"}
                        </span>
                        <span
                          className="id-chip"
                          title="Click to copy ID"
                          onClick={() => {
                            navigator.clipboard.writeText(issue._id);
                            showToast("Complaint ID copied!");
                          }}
                        >
                          #{issue._id ? issue._id.slice(-6) : "ID"}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-content-area" style={{ margin: "4px 0" }}>
                      <h2 className="card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                        {issue.title}
                      </h2>
                      <p className="card-description" style={{ fontSize: "13px" }}>
                        {issue.description}
                      </p>
                    </div>

                    {/* Compact Metadata Chips */}
                    <div className="card-meta-chips-row">
                      <span className="meta-chip">
                        📅 {issue.createdAt
                          ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recently"}
                      </span>

                      {(issue.latitude || issue.longitude) && (
                        <a
                          className="meta-chip location-link"
                          href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open GPS coordinates"
                        >
                          📍 {Number(issue.latitude).toFixed(3)}, {Number(issue.longitude).toFixed(3)} ↗
                        </a>
                      )}

                      <span className={`meta-chip ${assignedDept ? "assigned" : "unassigned"}`}>
                        🏢 {assignedDept ? assignedDept.name : "Not Assigned"}
                      </span>
                    </div>

                    {/* Compact Photos Strip */}
                    {(issue.photo || issue.resolvedPhoto) && (
                      <div className="card-photos-strip">
                        {issue.photo && (
                          <div
                            className="photo-strip-item"
                            title="Click to view full image"
                            onClick={() =>
                              setLightboxImage({
                                url: getPhotoUrl(issue.photo),
                                title: issue.title,
                                type: "Citizen Photo",
                              })
                            }
                          >
                            <img
                              src={getPhotoUrl(issue.photo)}
                              alt="Citizen reported issue"
                            />
                            <span className="photo-strip-tag">📷 Citizen Proof</span>
                            <span className="photo-strip-zoom-hint">🔍 Expand</span>
                          </div>
                        )}

                        {issue.resolvedPhoto && (
                          <div
                            className="photo-strip-item"
                            title="Click to view full image"
                            onClick={() =>
                              setLightboxImage({
                                url: getPhotoUrl(issue.resolvedPhoto),
                                title: issue.title,
                                type: "Completed Work Proof",
                              })
                            }
                            style={{ borderColor: "#10b981" }}
                          >
                            <img
                              src={getPhotoUrl(issue.resolvedPhoto)}
                              alt="Completed work proof"
                            />
                            <span className="photo-strip-tag resolved">✅ Resolved Proof</span>
                            <span className="photo-strip-zoom-hint">🔍 Expand</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compact Upload Completed Work Photo Section */}
                    <div className="compact-upload-box">
                      {photoPreviews[issue._id] ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                          <img
                            src={photoPreviews[issue._id]}
                            alt="Preview"
                            style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }}
                          />
                          <button
                            className="btn-upload-resolved"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            disabled={uploadingPhotoId === issue._id}
                            onClick={() => handleUploadResolvedPhoto(issue._id)}
                          >
                            {uploadingPhotoId === issue._id ? "Uploading..." : "Save & Resolve"}
                          </button>
                          <button
                            className="btn-cancel-upload"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => handleCancelPhotoSelect(issue._id)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <label
                            className="compact-upload-btn-label"
                            htmlFor={`card-file-${issue._id}`}
                          >
                            📸 {issue.resolvedPhoto ? "Replace Completed Work Proof" : "Upload Completed Work Proof"}
                          </label>
                          <input
                            id={`card-file-${issue._id}`}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              handlePhotoSelect(issue._id, e.target.files[0])
                            }
                          />
                        </>
                      )}
                    </div>

                    {/* Resolution Status Dropdown Footer */}
                    <div className="card-controls-footer" style={{ paddingTop: "12px" }}>
                      <div className="control-group">
                        <label className="control-label" style={{ fontSize: "10px" }}>
                          Update Resolution Status
                        </label>
                        <select
                          className={`status-select ${getStatusClass(issue.status)}`}
                          value={issue.status || "Submitted"}
                          onChange={(e) =>
                            handleStatusChange(issue._id, e.target.value)
                          }
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Verified">Verified</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Department Complaints Pagination Bar */}
          {!loading && filteredIssues.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalDeptPages}
              totalItems={filteredIssues.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default DepartmentDashboard;
