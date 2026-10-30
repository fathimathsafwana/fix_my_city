import { getStatusClass, getPhotoUrl } from "../../../utils/constants";
import { API_BASE_URL } from "../../../config";

export default function ViewIssueModal({
  issue,
  users = [],
  departments = [],
  onClose,
  onEdit,
  onInspectPhoto,
}) {
  if (!issue) return null;

  const citizenObj =
    typeof issue.user === "object" && issue.user !== null
      ? issue.user
      : users.find(
          (u) =>
            u._id ===
            (typeof issue.user === "object" && issue.user !== null
              ? issue.user._id
              : issue.user)
        );
  const citizenName = citizenObj?.name || issue.userName || "Citizen";
  const citizenEmail = citizenObj?.email || issue.userEmail || "Not provided";

  const displayStatus =
    !issue.status || issue.status === "Submitted" || issue.status === "Assigned"
      ? "Pending"
      : issue.status;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" style={{ margin: 0 }}>
            📋 Complaint Details
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
          {/* Metadata Card: ID, Current Status, Date */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                COMPLAINT ID
              </span>
              <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: "700", fontSize: "14px" }}>
                #{(issue.trackingId || String(issue._id)).slice(0, 10)}
              </span>
            </div>

            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                CURRENT STATUS
              </span>
              <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                <span className="status-dot"></span>
                {displayStatus}
              </span>
            </div>

            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                DATE
              </span>
              <span style={{ color: "#f1f5f9", fontWeight: "600", fontSize: "13px" }}>
                📅 {issue.createdAt
                  ? new Date(issue.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Recently"}
              </span>
            </div>
          </div>

          {/* Citizen Details: User Name & Email */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                CITIZEN NAME
              </span>
              <span style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                👤 {citizenName}
              </span>
            </div>

            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "block",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                CITIZEN EMAIL
              </span>
              <span style={{ color: "#38bdf8", fontWeight: "600", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all" }}>
                ✉️ {citizenEmail}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#94a3b8",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Title
            </label>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc" }}>
              {issue.title}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#94a3b8",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Description
            </label>
            <div
              style={{
                fontSize: "14px",
                color: "#cbd5e1",
                lineHeight: "1.55",
                background: "rgba(0,0,0,0.25)",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {issue.description || "No description provided."}
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#94a3b8",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Location
            </label>
            {issue.latitude || issue.longitude ? (
              <a
                className="meta-chip location-link"
                style={{ display: "inline-flex", width: "fit-content" }}
                href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📍 Coordinates: {issue.latitude}, {issue.longitude} ↗ (Open in Google Maps)
              </a>
            ) : (
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                📍 No location coordinates provided
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#94a3b8",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Photos
            </label>
            {issue.photo || issue.resolvedPhoto ? (
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {issue.photo && (
                  <div
                    style={{
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      width: "160px",
                      background: "rgba(15,23,42,0.9)",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                    onClick={() =>
                      onInspectPhoto &&
                      onInspectPhoto({
                        url: getPhotoUrl(issue.photo, API_BASE_URL),
                        title: issue.title,
                        type: "Citizen Photo Proof",
                      })
                    }
                    title="Click to expand full photo"
                  >
                    <img
                      src={getPhotoUrl(issue.photo, API_BASE_URL)}
                      alt="Citizen Proof"
                      style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        color: "#38bdf8",
                        textAlign: "center",
                        background: "rgba(15,23,42,0.95)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      📷 Citizen Photo (Zoom)
                    </div>
                  </div>
                )}
                {issue.resolvedPhoto && (
                  <div
                    style={{
                      cursor: "pointer",
                      border: "2px solid #10b981",
                      borderRadius: "8px",
                      overflow: "hidden",
                      width: "160px",
                      background: "rgba(15,23,42,0.9)",
                      transition: "transform 0.2s ease",
                    }}
                    onClick={() =>
                      onInspectPhoto &&
                      onInspectPhoto({
                        url: getPhotoUrl(issue.resolvedPhoto, API_BASE_URL),
                        title: issue.title,
                        type: "Completed Work Proof",
                      })
                    }
                    title="Click to expand resolved photo"
                  >
                    <img
                      src={getPhotoUrl(issue.resolvedPhoto, API_BASE_URL)}
                      alt="Resolved Photo"
                      style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        color: "#10b981",
                        textAlign: "center",
                        background: "rgba(15,23,42,0.95)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      ✅ Resolved Photo (Zoom)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                📷 No photos attached
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: onEdit && issue.status !== "Resolved" ? "space-between" : "flex-end",
              alignItems: "center",
              marginTop: "10px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {onEdit && issue.status !== "Resolved" && (
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => onEdit(issue)}
              >
                ✏️ Edit Complaint
              </button>
            )}
            <button
              type="button"
              className="btn-modal-submit"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
