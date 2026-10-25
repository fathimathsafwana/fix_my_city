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
                  color: user.isBlocked ? "#4ade80" : "#f87171",
                  borderColor: user.isBlocked ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
                }}
              >
                {user.isBlocked ? "🔓 Unblock Citizen" : "🚫 Block Citizen"}
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

