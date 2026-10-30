import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function LightboxModal({ lightboxImage, onClose }) {
  useEffect(() => {
    if (!lightboxImage) return;

    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, [lightboxImage, onClose]);

  if (!lightboxImage) return null;

  return createPortal(
    <div
      className="image-lightbox-overlay"
      style={{ zIndex: 999999999 }}
      onClick={onClose}
    >
      <div
        className="image-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="image-lightbox-close-btn"
          onClick={onClose}
          type="button"
          title="Close photo preview"
          aria-label="Close"
        >
          ✕
        </button>
        <img
          src={typeof lightboxImage === "string" ? lightboxImage : lightboxImage?.url}
          alt={(typeof lightboxImage === "object" ? lightboxImage?.title : "Proof preview") || "Proof preview"}
        />
        <div className="image-lightbox-caption">
          {typeof lightboxImage === "object" ? (
            <>
              {lightboxImage.title} {lightboxImage.type ? `• ${lightboxImage.type}` : ""}
            </>
          ) : (
            "Photo Preview"
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


