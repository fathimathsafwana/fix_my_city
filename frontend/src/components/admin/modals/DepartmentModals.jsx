export function CreateDeptModal({
  isOpen,
  newDeptData,
  setNewDeptData,
  creatingDept,
  showDeptPassword,
  setShowDeptPassword,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">🏢 Create New Department</h2>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="modal-form-group">
            <label>Department Name *</label>
            <input
              type="text"
              placeholder="e.g. Parks & Recreation, Traffic Management"
              required
              value={newDeptData.name}
              onChange={(e) =>
                setNewDeptData({ ...newDeptData, name: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Department Responsibilities & Description *</label>
            <textarea
              placeholder="e.g. Oversight and maintenance of municipal public works, parks and recreation facilities"
              required
              rows="3"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: "8px",
                color: "#f1f5f9",
                padding: "10px 14px",
                fontSize: "13.5px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              value={newDeptData.description}
              onChange={(e) =>
                setNewDeptData({ ...newDeptData, description: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Department Login Email *</label>
            <input
              type="email"
              placeholder="e.g. sanitation@fixmycity.gov"
              required
              value={newDeptData.email}
              onChange={(e) =>
                setNewDeptData({ ...newDeptData, email: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Department Login Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showDeptPassword ? "text" : "password"}
                placeholder="Set initial password for department login"
                required
                style={{ width: "100%", paddingRight: "45px" }}
                value={newDeptData.password}
                onChange={(e) =>
                  setNewDeptData({ ...newDeptData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowDeptPassword(!showDeptPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: 0,
                }}
                title={showDeptPassword ? "Hide password" : "Show password"}
              >
                {showDeptPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={creatingDept}
            >
              {creatingDept ? "Creating..." : "🏢 Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ViewDeptModal({
  viewingDept,
  issues = [],
  onClose,
  onEdit,
}) {
  if (!viewingDept) return null;

  const assignedCount = issues.filter(
    (i) =>
      (typeof i.department === "object" && i.department !== null
        ? i.department._id
        : i.department) === viewingDept._id
  ).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>
              {viewingDept.name}
            </h2>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              ID: #{viewingDept._id}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Description
            </label>
            <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", background: "rgba(0,0,0,0.25)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              {viewingDept.description || "No description provided."}
            </div>
          </div>

          {viewingDept.email && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Official Login Email
              </label>
              <div style={{ fontSize: "14px", color: "#38bdf8", fontWeight: 600 }}>
                {viewingDept.email}
              </div>
            </div>
          )}

          <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
              Assigned Complaints
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>
              {assignedCount}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Created: {viewingDept.createdAt ? new Date(viewingDept.createdAt).toLocaleDateString() : "Active"}
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => onEdit(viewingDept)}
              >
                ✏️ Edit Department
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

export function EditDeptModal({
  editingDept,
  editDeptData,
  setEditDeptData,
  savingDept,
  showEditDeptPassword,
  setShowEditDeptPassword,
  onClose,
  onSubmit,
}) {
  if (!editingDept) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">✏️ Edit Department</h2>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="modal-form-group">
            <label>Department Name *</label>
            <input
              type="text"
              required
              value={editDeptData.name}
              onChange={(e) =>
                setEditDeptData({ ...editDeptData, name: e.target.value })
              }
              placeholder="e.g. Roads & Bridges"
            />
          </div>

          <div className="modal-form-group">
            <label>Description & Scope *</label>
            <textarea
              rows="3"
              required
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: "8px",
                color: "#f1f5f9",
                padding: "10px 14px",
                fontSize: "13.5px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              value={editDeptData.description}
              onChange={(e) =>
                setEditDeptData({ ...editDeptData, description: e.target.value })
              }
              placeholder="Describe scope, responsibilities..."
            />
          </div>

          <div className="modal-form-group">
            <label>Department Login Email</label>
            <input
              type="email"
              placeholder="e.g. sanitation@fixmycity.gov"
              value={editDeptData.email}
              onChange={(e) =>
                setEditDeptData({ ...editDeptData, email: e.target.value })
              }
            />
          </div>

          <div className="modal-form-group">
            <label>Reset Password (leave blank to keep current)</label>
            <div style={{ position: "relative" }}>
              <input
                type={showEditDeptPassword ? "text" : "password"}
                placeholder="Enter new password"
                style={{ width: "100%", paddingRight: "45px" }}
                value={editDeptData.password}
                onChange={(e) =>
                  setEditDeptData({ ...editDeptData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowEditDeptPassword(!showEditDeptPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: 0,
                }}
                title={showEditDeptPassword ? "Hide password" : "Show password"}
              >
                {showEditDeptPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={savingDept}
            >
              {savingDept ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

