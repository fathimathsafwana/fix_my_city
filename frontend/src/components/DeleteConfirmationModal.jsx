import React, { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Reusable Delete Confirmation Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the confirmation modal is visible
 * @param {string} [props.title="Confirm Deletion"] - Modal title heading
 * @param {string} [props.itemName] - Name/title of the specific record being deleted
 * @param {string} [props.itemType] - Type of item (e.g., "Complaint", "Department", "User", "Feedback")
 * @param {string|React.ReactNode} [props.message] - Warning message or explanation
 * @param {string} [props.confirmText="Delete"] - Confirmation button label
 * @param {string} [props.cancelText="Cancel"] - Dismiss button label
 * @param {boolean} [props.isDeleting=false] - Whether the deletion request is currently pending
 * @param {Function} props.onConfirm - Callback triggered when confirmation button is clicked
 * @param {Function} props.onClose - Callback triggered when modal is canceled or closed
 */
export default function DeleteConfirmationModal({
  isOpen,
  title = "Confirm Deletion",
  itemName = "",
  itemType = "",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  // Lock background scroll and listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose?.();
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
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="delete-modal-overlay"
      onClick={() => {
        if (!isDeleting) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="delete-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="delete-modal-header">
          <div className="delete-modal-icon-badge" aria-hidden="true">
            🗑️
          </div>
          <div className="delete-modal-title-group">
            <h2 id="delete-modal-title" className="delete-modal-title">
              {title}
            </h2>
            <p className="delete-modal-subtitle">
              {message}
            </p>
          </div>
        </div>

        {/* Item details card if provided */}
        {itemName && (
          <div className="delete-modal-item-box">
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Target Record
              </span>
              <span className="delete-modal-item-name" title={itemName}>
                {itemName}
              </span>
            </div>
            {itemType && (
              <span className="delete-modal-item-badge">
                {itemType}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn-delete-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner-mini" style={{ width: "14px", height: "14px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span>
                Deleting...
              </>
            ) : (
              <>
                <span>🗑️</span>
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

