import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getAuthHeaders, getCurrentUser } from "../utils/auth";
import { getCategoryIcon } from "../utils/constants";

const TRACKING_STEPS = [
    { key: "Pending", label: "Pending", icon: "⏳", desc: "Logged in portal" },
    { key: "Verified", label: "Verified", icon: "🔍", desc: "Admin verified" },
    { key: "In Progress", label: "In Progress", icon: "🔧", desc: "Work underway" },
    { key: "Resolved", label: "Resolved", icon: "✅", desc: "Work completed" },
];

function TrackComplaint() {
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const queryId = searchParams.get("id");

    const [allIssues, setAllIssues] = useState([]);
    const [issues, setIssues] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchId, setSearchId] = useState(queryId || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [locations, setLocations] = useState({});

    // Inline edit / correct complaint state
    const [editingIssueId, setEditingIssueId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        category: "",
        description: "",
    });
    const [savingEdit, setSavingEdit] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const totalPages = Math.ceil(issues.length / pageSize) || 1;
    const paginatedIssues = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return issues.slice(startIndex, startIndex + pageSize);
    }, [issues, currentPage, pageSize]);

    useEffect(() => {
        const headers = getAuthHeaders();
        const currentUser = getCurrentUser();

        // Fetch issues and departments in parallel
        Promise.all([
            fetch(`${API_BASE_URL}/api/issues`, { headers }).then((res) => {
                if (!res.ok) throw new Error("Failed to fetch complaints");
                return res.json();
            }),
            fetch(`${API_BASE_URL}/api/departments`).then((res) => {
                return res.ok ? res.json() : [];
            }).catch(() => []),
        ])
            .then(([issuesData, deptsData]) => {
                let list = Array.isArray(issuesData) ? issuesData : [];

                // Normal users only see their own complaints
                if (currentUser && currentUser.role !== "admin" && currentUser.role !== "department") {
                    const currentUserId = String(currentUser.id || currentUser._id || "");
                    list = list.filter((item) => {
                        const itemUserId = item.user?._id || item.user;
                        return itemUserId && String(itemUserId) === currentUserId;
                    });
                }

                setAllIssues(list);
                setDepartments(Array.isArray(deptsData) ? deptsData : []);

                if (queryId) {
                    setSearchId(queryId);
                    const matched = list.filter((item) =>
                        item._id?.toLowerCase().includes(queryId.toLowerCase())
                    );
                    setIssues(matched.length > 0 ? matched : list);
                } else {
                    setIssues(list);
                }

                list.forEach((issue) => {
                    if (issue.latitude && issue.longitude) {
                        getLocationName(issue.latitude, issue.longitude, issue._id);
                    }
                });

                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load complaints.");
                setLoading(false);
            });
    }, [queryId]);

    const getLocationName = async (latitude, longitude, issueId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/location?latitude=${latitude}&longitude=${longitude}`
            );

            if (!response.ok) {
                throw new Error("Failed to get location");
            }

            const data = await response.json();

            setLocations((currentLocations) => ({
                ...currentLocations,
                [issueId]: data.location || "Location unavailable",
            }));
        } catch (err) {
            console.error("Error getting location:", err);
            setLocations((currentLocations) => ({
                ...currentLocations,
                [issueId]: "Location unavailable",
            }));
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        const query = searchId.trim().toLowerCase();
        if (!query) {
            setIssues(allIssues);
            setError("");
            return;
        }

        const filtered = allIssues.filter(
            (issue) =>
                issue._id?.toLowerCase().includes(query) ||
                issue.title?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            setIssues(filtered);
            setError("");
        } else {
            setIssues([]);
            setError(`No complaints found matching "${searchId.trim()}".`);
        }
    };

    const handleClear = () => {
        setCurrentPage(1);
        setSearchId("");
        setIssues(allIssues);
        setError("");
    };

    const getStepIndex = (status) => {
        const map = {
            Pending: 0,
            Submitted: 0,
            Assigned: 0,
            Verified: 1,
            "In Progress": 2,
            Resolved: 3,
        };
        return map[status] ?? 0;
    };

    const getDepartmentName = (deptId) => {
        if (!deptId) return "Pending Admin Assignment";
        const found = departments.find((d) => String(d._id) === String(deptId));
        return found ? found.name : "Assigned to Department";
    };

    const startEditing = (issue) => {
        if (issue.status === "Resolved") {
            showToast("Resolved complaints cannot be edited.", "warning");
            return;
        }
        setEditingIssueId(issue._id);
        setEditFormData({
            title: issue.title || "",
            category: issue.category || "",
            description: issue.description || "",
        });
    };

    const cancelEditing = () => {
        setEditingIssueId(null);
        setEditFormData({ title: "", category: "", description: "" });
    };

    const saveComplaintCorrection = async (issueId) => {
        const target = issues.find((i) => i._id === issueId);
        if (target && target.status === "Resolved") {
            showToast("Resolved complaints cannot be edited.", "warning");
            setEditingIssueId(null);
            return;
        }

        if (!editFormData.title.trim() || !editFormData.description.trim()) {
            showToast("Title and Description cannot be empty.", "warning");
            return;
        }

        setSavingEdit(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editFormData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to update complaint");
            }

            const data = await response.json();
            const updated = data.issue;

            setAllIssues((prev) =>
                prev.map((i) => (i._id === issueId ? { ...i, ...updated } : i))
            );
            setIssues((prev) =>
                prev.map((i) => (i._id === issueId ? { ...i, ...updated } : i))
            );

            setEditingIssueId(null);
            showToast("Complaint details updated successfully!", "success");
        } catch (err) {
            console.error("Error saving correction:", err);
            showToast(err.message || "Cannot connect to server to update.", "error");
        } finally {
            setSavingEdit(false);
        }
    };

    const getPhotoUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        return `${API_BASE_URL}${path}`;
    };

    return (
        <div className="track-page">
            <Navbar />
            <h1>Track Complaints</h1>

            <p className="track-description">
                Monitor live civic issues and inspect verified proof of completed department work.
            </p>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search by Complaint ID, title, or category..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                    }}
                />

                <button onClick={handleSearch}>
                    Search
                </button>

                <button onClick={handleClear}>
                    Clear
                </button>
            </div>

            {loading && <p>Loading complaints...</p>}

            {error && <p className="error-message">{error}</p>}

            {!loading && !error && issues.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                        You have not reported any civic issues yet.
                    </p>
                    <Link
                        to="/report"
                        className="btn-track-issue"
                        style={{ display: "inline-block", textDecoration: "none" }}
                    >
                        ➕ Report a Civic Issue
                    </Link>
                </div>
            )}

            {!loading && issues.length > 0 && (
                <>
                    <div className="complaints-list">
                        {paginatedIssues.map((issue) => {
                        const isEditing = editingIssueId === issue._id;
                        const currentStep = getStepIndex(issue.status);

                        return (
                            <div className="complaint-card-container" key={issue._id}>
                                {/* Straight Format from Left to Right */}
                                <div className="complaint-card straight-card">
                                    {/* Col 1: Photo or Category Icon (Far Left) */}
                                    <div className="straight-col-photo">
                                        {issue.photo ? (
                                            <a
                                                href={getPhotoUrl(issue.photo)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Click to view full photo"
                                            >
                                                <img
                                                    src={getPhotoUrl(issue.photo)}
                                                    alt="Citizen reported problem"
                                                    className="straight-thumb-img"
                                                />
                                                <span className="straight-photo-badge">📷 Problem</span>
                                            </a>
                                        ) : (
                                            <div className="straight-icon-placeholder">
                                                <span>{getCategoryIcon(issue.category)}</span>
                                                <span className="straight-icon-category-label">
                                                    {issue.category || "General"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Col 2: Info (Left-Center) */}
                                    <div className="straight-col-info">
                                        <div className="straight-title-row">
                                            <h3 className="straight-title">{issue.title}</h3>
                                            <span className="straight-id-pill">
                                                ID: <code>{issue._id}</code>
                                                <button
                                                    className="btn-copy-id"
                                                    title="Copy Complaint ID"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(issue._id);
                                                        showToast("Complaint ID copied!", "success");
                                                    }}
                                                    type="button"
                                                >
                                                    📋 Copy
                                                </button>
                                            </span>
                                        </div>

                                        <div className="straight-meta-row">
                                            <span className="straight-meta-item">
                                                <strong>📁</strong> {issue.category || "General"}
                                            </span>
                                            <span>•</span>
                                            <span className="straight-meta-item">
                                                <strong>🏢</strong> {getDepartmentName(issue.department)}
                                            </span>
                                            <span>•</span>
                                            <span className="straight-meta-item">
                                                <strong>📍</strong> {locations[issue._id] || "Getting location..."}
                                            </span>
                                            <span>•</span>
                                            <span className="straight-meta-item">
                                                <strong>📅</strong> {new Date(issue.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {issue.description && (
                                            <p className="straight-desc-preview" title={issue.description}>
                                                <strong>Note:</strong> {issue.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Col 3: Live 5-Step Stepper in straight line from left to right */}
                                    <div className="straight-col-stepper">
                                        <div className="straight-stepper-header">
                                            <span>Live Progress</span>
                                            <span style={{ color: issue.status === "Rejected" ? "#ef4444" : "var(--neon)" }}>
                                                Stage: {!issue.status || issue.status === "Submitted" || issue.status === "Assigned" ? "Pending" : issue.status}
                                            </span>
                                        </div>

                                        {issue.status === "Rejected" ? (
                                            <div style={{ color: "#ef4444", fontSize: "13px", padding: "10px 14px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span>❌</span> <strong>Grievance Rejected:</strong> This complaint was reviewed and closed as rejected.
                                            </div>
                                        ) : (
                                            <div className="straight-stepper-track">
                                                <div className="straight-stepper-bar-bg">
                                                    <div
                                                        className="straight-stepper-bar-fill"
                                                        style={{
                                                            width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%`,
                                                        }}
                                                    ></div>
                                                </div>

                                                {TRACKING_STEPS.map((step, idx) => {
                                                    const isCompleted = idx < currentStep;
                                                    const isActive = idx === currentStep;

                                                    return (
                                                        <div
                                                            key={step.key}
                                                            className={`straight-step-node ${
                                                                isCompleted ? "completed" : ""
                                                            } ${isActive ? "active" : ""}`}
                                                            title={`${step.label}: ${step.desc}`}
                                                        >
                                                            <div className="straight-step-dot">
                                                                {isCompleted ? "✓" : step.icon}
                                                            </div>
                                                            <span className="straight-step-text">{step.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Col 4: Actions (Far Right) */}
                                    <div className="straight-col-actions">
                                        <div className="straight-actions-row">
                                            {issue.status !== "Resolved" ? (
                                                <button
                                                    className="straight-btn-edit"
                                                    onClick={() => (isEditing ? cancelEditing() : startEditing(issue))}
                                                    type="button"
                                                >
                                                    {isEditing ? "✕ Close" : "✏️ Edit"}
                                                </button>
                                            ) : (
                                                <Link
                                                    to={`/feedback?issueId=${issue._id}`}
                                                    className={`straight-btn-rate ${issue.feedback?.rating ? "has-rated" : ""}`}
                                                    title="Submit or update feedback for this resolved complaint"
                                                >
                                                    ⭐ Feedback
                                                </Link>
                                            )}

                                            {issue.resolvedPhoto && (
                                                <a
                                                    href={getPhotoUrl(issue.resolvedPhoto)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="straight-btn-proof"
                                                    title="View Department Completed Work Proof Photo"
                                                >
                                                    ✅ Proof ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Inline Edit Drawer (only when user clicks Edit) */}
                                {isEditing && (
                                    <div className="complaint-edit-form" style={{ marginTop: "10px" }}>
                                        <h4>✏️ Correct Complaint Details</h4>
                                        <div className="edit-form-field">
                                            <label>Issue Title</label>
                                            <input
                                                type="text"
                                                value={editFormData.title}
                                                onChange={(e) =>
                                                    setEditFormData((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="Example: Broken street light"
                                            />
                                        </div>

                                        <div className="edit-form-field">
                                            <label>Description</label>
                                            <textarea
                                                rows={3}
                                                value={editFormData.description}
                                                onChange={(e) =>
                                                    setEditFormData((prev) => ({
                                                        ...prev,
                                                        description: e.target.value,
                                                    }))
                                                }
                                                placeholder="Describe the civic problem in detail..."
                                            />
                                        </div>

                                        <div className="edit-form-buttons">
                                            <button
                                                className="btn-save-changes"
                                                onClick={() => saveComplaintCorrection(issue._id)}
                                                disabled={savingEdit}
                                                type="button"
                                            >
                                                {savingEdit ? "Saving..." : "💾 Save Changes"}
                                            </button>
                                            <button
                                                className="btn-cancel-edit"
                                                onClick={cancelEditing}
                                                disabled={savingEdit}
                                                type="button"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={issues.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[5, 10, 20]}
                />
            </>
            )}
        </div>
    );
}

export default TrackComplaint;
