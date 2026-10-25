export default function EditIssueModal({
  editingIssue,
  editFormData,
  setEditFormData,
  departments = [],
  savingEdit = false,
  onClose,
  onSubmit,
}) {
  if (!editingIssue) return null;

  const currentStatus =
    !editFormData.status || editFormData.status === "Submitted"
      ? "Pending"
      : editFormData.status;

  const currentDept =
    typeof editFormData.department === "object" && editFormData.department !== null
      ? editFormData.department._id || ""
      : editFormData.department || "";

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">✏️ Edit Complaint #{editingIssue._id?.slice(-6)}</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ margin: 0 }}>Complaint Title</label>
            </div>
            <input
              type="text"
              readOnly
              disabled
              value={editingIssue.title || editFormData.title || ""}
              title="Complaint title cannot be edited by administrators"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div className="modal-form-group">
            <label>Assigned Department</label>
            <select
              value={currentDept}
              onChange={(e) =>
                setEditFormData({ ...editFormData, department: e.target.value })
              }
            >
              <option value="">⚠️ Unassigned (None)</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-form-group">
            <label>Current Status</label>
            <select
              value={currentStatus}
              onChange={(e) =>
                setEditFormData({ ...editFormData, status: e.target.value })
              }
            >
              <option value="Pending">⏳ Pending</option>
              <option value="Assigned">📋 Assigned</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="modal-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ margin: 0 }}>Description</label>
            </div>
            <textarea
              rows="3"
              readOnly
              disabled
              value={editingIssue.description || editFormData.description || "No description provided."}
              title="Complaint description cannot be edited by administrators"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#94a3b8",
                padding: "10px 14px",
                fontSize: "13.5px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={savingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

