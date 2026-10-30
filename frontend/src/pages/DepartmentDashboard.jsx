import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import Pagination from "../components/Pagination";
import ViewIssueModal from "../components/admin/modals/ViewIssueModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { API_BASE_URL } from "../config";
import { getAuthHeaders, getCurrentUser } from "../utils/auth";
import { getPhotoUrl } from "../utils/constants";

function DepartmentDashboard() {
  const { showToast } = useToast();

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  // Completed work photo upload states
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState({});

  // Modal States for View & Delete
  const [viewingIssue, setViewingIssue] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    issueId: null,
    issueTitle: "",
    isDeleting: false,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Lightbox Modal for high-res photo inspection
  const [lightboxImage, setLightboxImage] = useState(null);

  // Lock background scrolling and handle Escape key when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setLightboxImage(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
  }, [lightboxImage]);

  // Current logged in user from localStorage (and synced from backend)
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  const officerDeptId = useMemo(() => {
    try {
      const u = currentUser;
      if (u && u.department) {
        return typeof u.department === "object" ? String(u.department._id) : String(u.department);
      }
    } catch {}
    return "";
  }, [currentUser]);

  const [selectedDeptId, setSelectedDeptId] = useState(() => {
    try {
      const u = getCurrentUser();
      if (u && u.department) {
        return typeof u.department === "object" ? String(u.department._id) : String(u.department);
      }
    } catch {}
    return "All";
  });

  // Sync user profile on mount to ensure fresh department role permissions
  useEffect(() => {
    const user = getCurrentUser();
    if (user && (user.id || user._id)) {
      fetch(`${API_BASE_URL}/api/users/${user.id || user._id}`, {
        headers: getAuthHeaders(),
      })
        .then((res) => res.json())
        .then((fresh) => {
          if (fresh && fresh._id) {
            const updated = {
              ...user,
              name: fresh.name,
              email: fresh.email,
              role: fresh.role,
              department: fresh.department,
            };
            localStorage.setItem("user", JSON.stringify(updated));
            setCurrentUser(updated);
            if (!fresh.department) {
              setSelectedDeptId("All");
            } else if (typeof fresh.department === "object" && fresh.department._id) {
              setSelectedDeptId(String(fresh.department._id));
            } else if (typeof fresh.department === "string") {
              setSelectedDeptId(fresh.department);
            }
          }
        })
        .catch(console.error);
    }
  }, []);

  const activeDept = useMemo(() => {
    if (selectedDeptId === "All") return null;
    return departments.find((d) => String(d._id) === String(selectedDeptId)) || null;
  }, [departments, selectedDeptId]);

  const fetchIssues = () => {
    fetch(`${API_BASE_URL}/api/issues`, {
      headers: getAuthHeaders(),
    })
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
    fetch(`${API_BASE_URL}/api/departments`)
      .then((response) => response.json())
      .then((data) => {
        const depts = Array.isArray(data) ? data : [];
        setDepartments(depts);
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  };

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  };

  useEffect(() => {
    fetchIssues();
    fetchDepartments();
    fetchUsers();
  }, []);

  const handlePhotoSelect = (issueId, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Photo must be less than 10MB in size.", "error");
      return;
    }

    setSelectedPhotos((prev) => ({
      ...prev,
      [issueId]: file,
    }));

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviews((prev) => ({
      ...prev,
      [issueId]: previewUrl,
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
      showToast("Please select a completed work proof photo first.", "warning");
      return;
    }

    setUploadingPhotoId(issueId);
    try {
      const formData = new FormData();
      formData.append("resolvedPhoto", file);

      const response = await fetch(
        `${API_BASE_URL}/api/issues/${issueId}/resolved-photo`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload resolved photo proof");
      }

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId
            ? data.issue
              ? data.issue
              : { ...item, status: "Resolved", resolvedPhoto: data.resolvedPhoto || data.url }
            : item
        )
      );

      handleCancelPhotoSelect(issueId);
      showToast("Proof photo uploaded and complaint marked as Resolved!", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Cannot connect to server to upload photo.", "error");
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    const targetIssue = issues.find((i) => i._id === issueId);
    if (targetIssue && (targetIssue.status === "Resolved" || targetIssue.resolvedPhoto)) {
      showToast("Resolved complaints are closed and cannot be modified.", "warning");
      return;
    }

    if (newStatus === "Resolved" && (!targetIssue || !targetIssue.resolvedPhoto)) {
      showToast("Proof image of completed work is required before marking as Resolved.", "warning");
      return;
    }

    setUpdatingId(issueId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues/${issueId}/status`,
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId ? (data.issue ? data.issue : { ...item, status: newStatus }) : item
        )
      );

      showToast(`Status successfully updated to "${newStatus}"!`, "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to update complaint status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteIssue = (issueId, issueTitle) => {
    const target = issues.find((i) => i._id === issueId);
    if (target && (target.status === "Resolved" || target.resolvedPhoto)) {
      showToast("Resolved complaints cannot be deleted.", "warning");
      return;
    }

    setDeleteModal({
      isOpen: true,
      issueId,
      issueTitle: issueTitle || `#${issueId}`,
      isDeleting: false,
    });
  };

  const confirmDeleteIssue = async () => {
    if (!deleteModal.issueId) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${deleteModal.issueId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete complaint.");
      }

      setIssues((prev) => prev.filter((i) => i._id !== deleteModal.issueId));
      showToast("Complaint deleted successfully.", "info");
      setDeleteModal({ isOpen: false, issueId: null, issueTitle: "", isDeleting: false });
    } catch (err) {
      showToast(err.message || "Failed to delete complaint.", "error");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Current Department Object for logged-in officer
  const currentDept = useMemo(() => {
    if (currentUser?.department && typeof currentUser.department === "object" && currentUser.department.name) {
      return currentUser.department;
    }
    if (officerDeptId) {
      return departments.find((d) => String(d._id) === officerDeptId) || null;
    }
    return null;
  }, [departments, currentUser, officerDeptId]);

  // Filter issues based on department, search, and status
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const issueDeptId =
        typeof issue.department === "object" && issue.department !== null
          ? String(issue.department._id)
          : String(issue.department);

      if (selectedDeptId !== "All" && issueDeptId !== selectedDeptId) {
        return false;
      }

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Pending"
          ? !issue.status || issue.status === "Pending" || issue.status === "Submitted" || issue.status === "Assigned"
          : statusFilter === "Resolved"
          ? issue.status === "Resolved" || !!issue.resolvedPhoto
          : issue.status === statusFilter;

      const matchesSearch =
        searchQuery === "" ||
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [issues, selectedDeptId, statusFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, selectedDeptId]);

  // Paginated Complaints
  const totalDeptPages = Math.ceil(filteredIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, currentPage, pageSize]);

  // Statistics for Department
  const stats = useMemo(() => {
    const relevant = selectedDeptId !== "All"
      ? issues.filter((i) => {
          const deptId =
            typeof i.department === "object" && i.department !== null
              ? String(i.department._id)
              : String(i.department);
          return deptId === selectedDeptId;
        })
      : issues;

    return {
      total: relevant.length,
      pending: relevant.filter(
        (i) => (!i.status || i.status === "Pending" || i.status === "Submitted" || i.status === "Assigned") && !i.resolvedPhoto
      ).length,
      verified: relevant.filter((i) => i.status === "Verified" && !i.resolvedPhoto).length,
      inProgress: relevant.filter((i) => i.status === "In Progress" && !i.resolvedPhoto).length,
      resolved: relevant.filter((i) => i.status === "Resolved" || !!i.resolvedPhoto).length,
      rejected: relevant.filter((i) => i.status === "Rejected").length,
    };
  }, [issues, selectedDeptId]);

  const getStatusBadgeClass = (status, hasResolvedPhoto) => {
    if (hasResolvedPhoto || status === "Resolved") {
      return "status-resolved";
    }
    if (status === "In Progress") {
      return "status-in-progress";
    }
    if (status === "Verified") {
      return "status-verified";
    }
    if (status === "Rejected") {
      return "status-rejected";
    }
    return "status-pending";
  };

  return (
    <div className="department-page">
      <Navbar />

      {/* Lightbox Photo Preview Modal (Portaled directly to document.body for topmost stacking order) */}
      {lightboxImage &&
        createPortal(
          <div
            className="image-lightbox-overlay"
            style={{ zIndex: 999999999 }}
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
          </div>,
          document.body
        )}

      {/* View Complaint Details Modal */}
      {viewingIssue && (
        <ViewIssueModal
          issue={viewingIssue}
          users={users}
          departments={departments}
          onClose={() => setViewingIssue(null)}
          onInspectPhoto={(photo) =>
            setLightboxImage({
              url: photo.url,
              title: photo.title || viewingIssue.title,
              type: photo.type,
            })
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Complaint"
        itemName={deleteModal.issueTitle}
        itemType="Complaint"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
        confirmText="Delete Complaint"
        isDeleting={deleteModal.isDeleting}
        onConfirm={confirmDeleteIssue}
        onClose={() =>
          setDeleteModal({ isOpen: false, issueId: null, issueTitle: "", isDeleting: false })
        }
      />

      <div className="dashboard-container">
        {/* Department Dashboard Header */}
        <div className="dashboard-header">
          <div className="dept-header-title-wrap">
            <h1 className="dashboard-title">
              {activeDept ? (
                <span>{activeDept.name}</span>
              ) : (
                <span>Municipal Department Dashboard</span>
              )}
            </h1>
            <p className="dashboard-subtitle">
              {activeDept
                ? `Viewing issues assigned to ${activeDept.name} • ${stats.total} total complaints`
                : `Please log in using a dedicated department account (Sanitation, Roads, or Water Supply).`}
            </p>
          </div>
        </div>

        {/* Department Operations Filter & Controls Toolbar - Top of Table */}
        <div className="complaints-center-toolbar">
          <div className="toolbar-left-controls">
            {/* Search Complaints */}
            <div className="toolbar-search">
              <span className="search-icon">🔍</span>
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
                <option value="Verified">🔍 Verified</option>
                <option value="In Progress">🔧 In Progress</option>
                <option value="Resolved">✨ Resolved</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>
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
                {activeDept
                  ? `No complaints currently match filters for ${activeDept.name}.`
                  : "No complaints found matching the current search or filters."}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "8px",
                }}
              >
                💡 Tip: Admins can assign newly reported issues to departments.
              </p>
            </div>
          )}

          {/* =========================================================
              EXECUTIVE COMPLAINT CARDS GRID VIEW
              ========================================================= */}
          {!loading && filteredIssues.length > 0 && (
            <div className="dashboard-cards-grid">
              {paginatedIssues.map((issue) => {
                return (
                  <div
                    className={`dashboard-card ${
                      updatingId === issue._id ? "card-updating" : ""
                    }`}
                    key={issue._id}
                  >
                    {/* Top Row: ID Badge & Quick Actions */}
                    <div className="dept-card-top-bar">
                      <span
                        className="dept-card-id"
                        title="Click to copy Tracking ID"
                        onClick={() => {
                          const trackId = (issue.trackingId || String(issue._id)).slice(0, 10);
                          navigator.clipboard.writeText(trackId);
                          showToast("Tracking ID copied!");
                        }}
                      >
                        #{(issue.trackingId || String(issue._id)).slice(0, 10)}
                      </span>

                      <div className="dept-card-actions">
                        <button
                          className="dept-card-btn"
                          onClick={() => setViewingIssue(issue)}
                          title="Inspect Complaint Details"
                          type="button"
                        >
                          👁️
                        </button>
                        {issue.status !== "Resolved" && !issue.resolvedPhoto ? (
                          <button
                            className="dept-card-btn delete"
                            onClick={() => handleDeleteIssue(issue._id, issue.title)}
                            title="Delete Complaint"
                            type="button"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button
                            className="dept-card-btn delete"
                            disabled
                            title="Resolved complaints cannot be deleted"
                            type="button"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Meta Details */}
                    <div className="dept-card-header">
                      <h2 className="dept-card-title" title={issue.title}>
                        {issue.title}
                      </h2>
                      <div className="dept-card-meta-row">
                        <span className="dept-meta-pill">
                          👤 {typeof issue.user === "object" && issue.user !== null
                            ? issue.user.name || "Citizen"
                            : users.find((u) => u._id === issue.user)?.name || issue.userName || "Citizen"}
                        </span>
                        <span className="dept-meta-pill">
                          📅 {issue.createdAt
                            ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently"}
                        </span>
                      </div>
                    </div>

                    {/* Photos Strip (Original Problem Photo & Completed Work Photo side-by-side) */}
                    {(issue.photo || issue.resolvedPhoto) && (
                      <div className="dept-card-photos">
                        {issue.photo && (
                          <div
                            className="dept-photo-frame"
                            style={{ height: issue.resolvedPhoto ? "115px" : "140px" }}
                            onClick={() =>
                              setLightboxImage({
                                url: getPhotoUrl(issue.photo, API_BASE_URL),
                                title: issue.title || "Citizen Report Photo",
                                type: "Reported Problem Photo",
                              })
                            }
                            title="Click to view Problem Photo"
                          >
                            <img
                              src={getPhotoUrl(issue.photo, API_BASE_URL)}
                              alt="Reported problem"
                              loading="lazy"
                              style={{ height: issue.resolvedPhoto ? "115px" : "140px" }}
                            />
                            <span className="dept-photo-tag problem">📷 Problem</span>
                          </div>
                        )}
                        {issue.resolvedPhoto && (
                          <div
                            className="dept-photo-frame"
                            style={{ height: issue.photo ? "115px" : "140px", borderColor: "rgba(16, 185, 129, 0.4)" }}
                            onClick={() =>
                              setLightboxImage({
                                url: getPhotoUrl(issue.resolvedPhoto, API_BASE_URL),
                                title: issue.title || "Completed Work Proof",
                                type: "Completed Work Proof",
                              })
                            }
                            title="Click to view Resolved Proof"
                          >
                            <img
                              src={getPhotoUrl(issue.resolvedPhoto, API_BASE_URL)}
                              alt="Completed work proof"
                              loading="lazy"
                              style={{ height: issue.photo ? "115px" : "140px" }}
                            />
                            <span className="dept-photo-tag resolved">✅ Resolved</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compact Upload Completed Work Photo Section */}
                    {issue.status !== "Resolved" && !issue.resolvedPhoto && (
                      <div className="dept-upload-box">
                        {photoPreviews[issue._id] ? (
                          <div className="dept-upload-preview-row">
                            <img
                              src={photoPreviews[issue._id]}
                              alt="Preview"
                              className="dept-preview-thumb"
                            />
                            <button
                              className="dept-btn-save-resolve"
                              disabled={uploadingPhotoId === issue._id}
                              onClick={() => handleUploadResolvedPhoto(issue._id)}
                              type="button"
                            >
                              {uploadingPhotoId === issue._id ? "Uploading..." : "Save & Resolve"}
                            </button>
                            <button
                              className="dept-btn-cancel-upload"
                              onClick={() => handleCancelPhotoSelect(issue._id)}
                              type="button"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <label
                              className="dept-upload-label"
                              htmlFor={`card-file-${issue._id}`}
                            >
                              📸 <span>Attach Proof Image to Resolve</span>
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
                    )}

                    {/* Footer: Status */}
                    <div className="dept-card-footer">
                      {issue.status === "Resolved" || !!issue.resolvedPhoto ? (
                        <div className="dept-resolved-locked">
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            ✅ Resolved
                          </span>
                          <span style={{ fontSize: "11px", opacity: 0.85, fontWeight: 600 }}>
                            🔒 Closed
                          </span>
                        </div>
                      ) : (
                        <select
                          className={`dept-status-dropdown ${getStatusBadgeClass(
                            issue.status,
                            !!issue.resolvedPhoto
                          )}`}
                          value={
                            issue.status === "In Progress"
                              ? "In Progress"
                              : issue.status === "Verified"
                              ? "Verified"
                              : issue.status === "Rejected"
                              ? "Rejected"
                              : "Pending"
                          }
                          onChange={(e) =>
                            handleStatusChange(issue._id, e.target.value)
                          }
                          disabled={updatingId === issue._id}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="In Progress">In Progress</option>
                          <option
                            value="Resolved"
                            disabled={!issue.resolvedPhoto}
                            title={!issue.resolvedPhoto ? "Upload completed work proof image first" : ""}
                          >
                            {issue.resolvedPhoto ? "Resolved" : "Resolved (Proof Required)"}
                          </option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      )}
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
    </div>
  );
}

export default DepartmentDashboard;
