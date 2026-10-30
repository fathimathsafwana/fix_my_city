export default function ViewUserModal({
  user,
  departments = [],
  onClose,
  onToggleBlock,
}) {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>
              {user.name || "Citizen Account"}
            </h2>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              ID: #{user._id}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Email Address
              </label>
              <div style={{ fontSize: "13.5px", color: "#38bdf8", fontWeight: 600 }}>
                ✉️ {user.email}
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Account Status
              </label>
              <div>
                <button
                  type="button"
                  className={`pro-status-badge ${
                    user.isBlocked ? "status-blocked" : "status-active"
                  }`}
                  onClick={() => onToggleBlock && onToggleBlock(user)}
                  title={user.isBlocked ? "Click to Unblock Citizen" : "Click to Block Citizen"}
                >
                  <span className="status-dot"></span>
                  {user.isBlocked ? "Blocked" : "Active"}
                </button>
              </div>
            </div>
          </div>

          {user.role === "department" && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Assigned Municipal Department
              </label>
              <div style={{ fontSize: "13.5px", color: "#a855f7", fontWeight: 600 }}>
                {typeof user.department === "object" && user.department !== null
                  ? user.department.name
                  : departments.find((d) => d._id === user.department)?.name || "Unassigned"}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => onToggleBlock(user)}
                style={{
                  color: user.isBlocked ? "#f87171" : "#4ade80",
                  borderColor: user.isBlocked ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {user.isBlocked ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                    </svg>
                    Unblock Citizen
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                    Block Citizen
                  </>
                )}
              </button>
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
    </div>
  );
}

