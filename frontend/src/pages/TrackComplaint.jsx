import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import LightboxModal from "../components/admin/modals/LightboxModal";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getAuthHeaders, getCurrentUser } from "../utils/auth";
import { getCategoryIcon, getIssueCategory, getTrackingId } from "../utils/constants";

const TRACKING_STEPS = [
    { key: "Pending", label: "Pending", desc: "Logged in portal" },
    { key: "Verified", label: "Verified", desc: "Admin verified" },
    { key: "In Progress", label: "In Progress", desc: "Work underway" },
    { key: "Resolved", label: "Resolved", desc: "Work completed" },
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

    // Lightbox Modal for high-res photo inspection (Proof / Problem Image)
    const [lightboxImage, setLightboxImage] = useState(null);

    // Feedback Modal state
    const [feedbackIssue, setFeedbackIssue] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Lock background scrolling and handle Escape key for feedback modal
    useEffect(() => {
        if (!feedbackIssue) return;

        document.body.classList.add("modal-open");
        document.documentElement.classList.add("modal-open");

        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !submittingFeedback) {
                setFeedbackIssue(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (!document.querySelector(".modal-overlay, .image-lightbox-overlay")) {
                document.body.classList.remove("modal-open");
                document.documentElement.classList.remove("modal-open");
            }
        };
    }, [feedbackIssue, submittingFeedback]);

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
                    const q = queryId.toLowerCase();
                    const matched = list.filter((item) => {
                        const fullId = String(item._id || "").toLowerCase();
                        const tid = getTrackingId(item).toLowerCase();
                        return fullId.includes(q) || tid.includes(q);
                    });
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

        const filtered = allIssues.filter((issue) => {
            const fullId = String(issue._id || "").toLowerCase();
            const tid = getTrackingId(issue).toLowerCase();
            return (
                tid.includes(query) ||
                fullId.includes(query) ||
                issue.title?.toLowerCase().includes(query) ||
                issue.category?.toLowerCase().includes(query) ||
                issue.description?.toLowerCase().includes(query)
            );
        });

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
        if (typeof deptId === "object" && deptId !== null) {
            if (deptId.name) return deptId.name;
            deptId = deptId._id;
        }
        const found = departments.find((d) => String(d._id) === String(deptId));
        return found ? found.name : "Assigned to Department";
    };

    const startEditing = (issue) => {
        if (issue.status === "Resolved") {
            showToast("Resolved complaints cannot be edited.", "warning");
            return;
        }
        if (issue.status === "Verified" || issue.status === "In Progress" || issue.status === "Assigned") {
            showToast("Verified complaints cannot be edited.", "warning");
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
        if (target && (target.status === "Verified" || target.status === "In Progress" || target.status === "Assigned")) {
            showToast("Verified complaints cannot be edited.", "warning");
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

    const openFeedbackModal = (issue) => {
        setFeedbackIssue(issue);
        setFeedbackRating(issue.feedback?.rating || 5);
        setHoverRating(0);
        setFeedbackComment(issue.feedback?.comment || "");
    };

    const getRatingLabel = (val) => {
        switch (val) {
            case 5:
                return "Excellent";
            case 4:
                return "Very Good";
            case 3:
                return "Good";
            case 2:
                return "Needs Improvement";
            case 1:
                return "Poor";
            default:
                return "";
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackIssue) return;

        if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
            showToast("Please choose a rating between 1 and 5 stars.", "warning");
            return;
        }

        if (!feedbackComment.trim()) {
            showToast("Please write your comments and suggestions.", "warning");
            return;
        }

        setSubmittingFeedback(true);
        try {
            const headers = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };

            const response = await fetch(`${API_BASE_URL}/api/feedback`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    issueId: feedbackIssue._id,
                    rating: feedbackRating,
                    category: "Resolution Quality",
                    comment: feedbackComment.trim(),
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to submit feedback.");
            }

            const newFeedback = {
                rating: feedbackRating,
                comment: feedbackComment.trim(),
                submittedAt: new Date(),
            };

            setAllIssues((prev) =>
                prev.map((i) => (i._id === feedbackIssue._id ? { ...i, feedback: newFeedback } : i))
            );
            setIssues((prev) =>
                prev.map((i) => (i._id === feedbackIssue._id ? { ...i, feedback: newFeedback } : i))
            );

            showToast("Thank you! Your feedback has been recorded.", "success");
            setFeedbackIssue(null);
        } catch (err) {
            console.error("Error submitting feedback:", err);
            showToast(err.message || "Cannot submit feedback.", "error");
        } finally {
            setSubmittingFeedback(false);
        }
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
                    placeholder="Search by 10-character Tracking ID, title, or category..."
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

                            const locationText = locations[issue._id] || "Detecting location...";
                            const hasValidCoords =
                                typeof issue.latitude === "number" &&
                                typeof issue.longitude === "number" &&
                                (issue.latitude !== 0 || issue.longitude !== 0);

                            const mapUrl = hasValidCoords
                                ? `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`
                                : locations[issue._id] &&
                                  locations[issue._id] !== "Location unavailable" &&
                                  locations[issue._id] !== "Detecting location..."
                                ? `https://www.google.com/maps?q=${encodeURIComponent(locations[issue._id])}`
                                : null;

                            return (
                                <div className="complaint-card-container" key={issue._id}>
                                    {/* Straight Format from Left to Right */}
                                    <div className="complaint-card straight-card">
                                        {/* Col 1: Photo or Category Icon (Far Left) */}
                                        <div className="straight-col-photo">
                                            {issue.photo ? (
                                                <button
                                                    type="button"
                                                    className="straight-photo-trigger-btn"
                                                    onClick={() =>
                                                        setLightboxImage({
                                                            url: getPhotoUrl(issue.photo),
                                                            title: issue.title || "Citizen Issue",
                                                            type: "Citizen Problem Photo",
                                                        })
                                                    }
                                                    title="Click to view full photo"
                                                >
                                                    <img
                                                        src={getPhotoUrl(issue.photo)}
                                                        alt="Citizen reported problem"
                                                        className="straight-thumb-img"
                                                    />
                                                    <span className="straight-photo-badge">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                            <circle cx="12" cy="13" r="4"></circle>
                                                        </svg>
                                                        <span>Problem</span>
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="straight-icon-placeholder">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="9" y1="3" x2="9" y2="21"></line>
                                                    </svg>
                                                    <span className="straight-icon-category-label">
                                                        {getIssueCategory(issue, departments)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Col 2: Info (Left-Center) */}
                                        <div className="straight-col-info">
                                            <div className="straight-title-row">
                                                <h3 className="straight-title">{issue.title}</h3>
                                                <span className="straight-id-pill">
                                                    ID: <code>{getTrackingId(issue)}</code>
                                                    <button
                                                        className="btn-copy-id"
                                                        title="Copy 10-character Tracking ID"
                                                        onClick={() => {
                                                            const trackId = getTrackingId(issue);
                                                            navigator.clipboard.writeText(trackId);
                                                            showToast("Tracking ID copied!", "success");
                                                        }}
                                                        type="button"
                                                    >
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                        </svg>
                                                        <span>Copy</span>
                                                    </button>
                                                </span>
                                            </div>

                                            {(() => {
                                                const rawDept = getDepartmentName(issue.department);
                                                const categoryName = getIssueCategory(issue, departments);
                                                const isAssigned = rawDept && rawDept !== "Pending Admin Assignment" && rawDept !== "Assigned to Department";
                                                const deptDisplayName = isAssigned ? rawDept : categoryName;
                                                const icon = getCategoryIcon(deptDisplayName);

                                                return (
                                                    <div className="straight-meta-row">
                                                        <span className="straight-dept-chip" style={{
                                                            background: "rgba(56, 189, 248, 0.12)",
                                                            color: "#38bdf8",
                                                            border: "1px solid rgba(56, 189, 248, 0.3)",
                                                            fontWeight: 600,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px"
                                                        }}>
                                                            <span>{icon}</span>
                                                            <span>{deptDisplayName}</span>
                                                        </span>
                                                        {!isAssigned && (
                                                            <span className="straight-dept-chip" style={{
                                                                background: "rgba(245, 158, 11, 0.1)",
                                                                color: "#fbbf24",
                                                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                                                fontSize: "11px",
                                                                fontWeight: 500
                                                            }}>
                                                                ⏳ Pending Assignment
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <div className="straight-meta-row straight-meta-details-row">
                                                {mapUrl ? (
                                                    <a
                                                        href={mapUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="straight-meta-text straight-meta-location-link"
                                                        title="Click to view location in Google Maps"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                        <span className="straight-location-label">{locationText}</span>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="straight-external-icon">
                                                            <line x1="7" y1="17" x2="17" y2="7"></line>
                                                            <polyline points="7 7 17 7 17 17"></polyline>
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    <span className="straight-meta-text" title={locationText}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.75 }}>
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                        <span className="straight-location-label">{locationText}</span>
                                                    </span>
                                                )}

                                                <span className="straight-meta-divider">•</span>

                                                <span className="straight-meta-text">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.75 }}>
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    <span>{new Date(issue.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Col 3: Live Stepper in straight line from left to right */}
                                        <div className="straight-col-stepper">
                                            <div className="straight-stepper-header">
                                                <span className="straight-stepper-label">Live Progress</span>
                                                <span className={`straight-status-pill status-${(issue.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                                                    {issue.status === "Assigned" || issue.status === "Submitted" || !issue.status ? "Pending" : issue.status}
                                                </span>
                                            </div>

                                            {issue.status === "Rejected" ? (
                                                <div style={{ color: "#f87171", fontSize: "12.5px", padding: "10px 14px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <strong>Grievance Rejected:</strong> This complaint was reviewed and closed as rejected.
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
                                                        const isResolved = issue.status === "Resolved";
                                                        const isCompleted = isResolved ? idx <= currentStep : idx < currentStep;
                                                        const isActive = !isResolved && idx === currentStep;

                                                        return (
                                                            <div
                                                                key={step.key}
                                                                className={`straight-step-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                                                                title={`${step.label}: ${step.desc}`}
                                                            >
                                                                <div className="straight-step-dot">
                                                                    {isCompleted ? (
                                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                        </svg>
                                                                    ) : (
                                                                        <span>{idx + 1}</span>
                                                                    )}
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
                                                {issue.status === "Resolved" ? (
                                                    <button
                                                        type="button"
                                                        className={`straight-btn-rate ${issue.feedback?.rating ? "has-rated" : ""}`}
                                                        title={
                                                            issue.feedback?.rating
                                                                ? "View or update feedback for this resolved complaint"
                                                                : "Submit feedback for this resolved complaint"
                                                        }
                                                        onClick={() => openFeedbackModal(issue)}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill={issue.feedback?.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                        </svg>
                                                        <span>{issue.feedback?.rating ? `Feedback (${issue.feedback.rating}★)` : "Feedback"}</span>
                                                    </button>
                                                ) : issue.status === "Verified" || issue.status === "In Progress" || issue.status === "Assigned" || issue.status === "Rejected" ? null : (
                                                    <button
                                                        className="straight-btn-edit"
                                                        onClick={() => (isEditing ? cancelEditing() : startEditing(issue))}
                                                        type="button"
                                                    >
                                                        {isEditing ? (
                                                            <span>Close</span>
                                                        ) : (
                                                            <>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                <span>Edit</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {issue.resolvedPhoto && (
                                                    <button
                                                        type="button"
                                                        className="straight-btn-proof"
                                                        title="View Department Completed Work Proof Photo"
                                                        onClick={() =>
                                                            setLightboxImage({
                                                                url: getPhotoUrl(issue.resolvedPhoto),
                                                                title: issue.title || "Department Work Proof",
                                                                type: "Completed Work Proof",
                                                            })
                                                        }
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                            <polyline points="21 15 16 10 5 21"></polyline>
                                                        </svg>
                                                        <span>Proof</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Edit Drawer (only when user clicks Edit) */}
                                    {isEditing && issue.status !== "Resolved" && issue.status !== "Verified" && issue.status !== "In Progress" && issue.status !== "Assigned" && (
                                        <div className="complaint-edit-form" style={{ marginTop: "10px" }}>
                                            <h4>Correct Complaint Details</h4>
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
                                                    {savingEdit ? "Saving..." : "Save Changes"}
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

            {/* Proof & Problem Image Lightbox Modal with Close Icon */}
            <LightboxModal
                lightboxImage={lightboxImage}
                onClose={() => setLightboxImage(null)}
            />

            {/* Citizen Feedback Modal with Close Icon */}
            {feedbackIssue &&
                createPortal(
                    <div
                        className="modal-overlay"
                        style={{ zIndex: 99999999 }}
                        onClick={() => {
                            if (!submittingFeedback) setFeedbackIssue(null);
                        }}
                    >
                        <div
                            className="modal-dialog"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                    {feedbackIssue.feedback?.rating ? "Update Feedback & Rating" : "Submit Feedback & Rating"}
                                </h2>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => setFeedbackIssue(null)}
                                    title="Close feedback"
                                    aria-label="Close"
                                    disabled={submittingFeedback}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                                Complaint: <strong style={{ color: "var(--text-primary)" }}>{feedbackIssue.title}</strong>
                                <span style={{ marginLeft: "8px", fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--text-muted)" }}>
                                    (ID: {feedbackIssue._id})
                                </span>
                            </div>

                            <form onSubmit={handleSubmitFeedback} className="modal-form" style={{ marginTop: "18px" }}>
                                <div className="modal-form-group">
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                                        Ratings *
                                    </label>
                                    <div className="feedback-star-picker" style={{ justifyContent: "center" }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-select-btn ${star <= (hoverRating || feedbackRating) ? "active" : ""
                                                    }`}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setFeedbackRating(star)}
                                                aria-label={`${star} Star`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                        <span className="star-feedback-label">
                                            {getRatingLabel(hoverRating || feedbackRating)}
                                        </span>
                                    </div>
                                </div>

                                <div className="modal-form-group">
                                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                        Comments and Suggestions *
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Share your comments, experience, or suggestions to improve..."
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            background: "#0d1117",
                                            border: "1px solid rgba(255, 255, 255, 0.16)",
                                            borderRadius: "8px",
                                            padding: "10px 12px",
                                            color: "#f1f5f9",
                                            fontSize: "13.5px",
                                            fontFamily: "inherit",
                                            resize: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "10px",
                                        marginTop: "16px",
                                        paddingTop: "14px",
                                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn-modal-cancel"
                                        onClick={() => setFeedbackIssue(null)}
                                        disabled={submittingFeedback}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-modal-submit"
                                        disabled={submittingFeedback}
                                    >
                                        {submittingFeedback ? "Submitting..." : "⭐ Submit Feedback"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default TrackComplaint;