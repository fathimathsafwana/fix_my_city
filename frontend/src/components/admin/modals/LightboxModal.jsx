import { createPortal } from "react-dom";

export default function LightboxModal({ lightboxImage, onClose }) {
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
        >
          ✕
        </button>
        <img src={lightboxImage.url} alt={lightboxImage.title || "Proof preview"} />
        <div className="image-lightbox-caption">
          {lightboxImage.title} {lightboxImage.type ? `• ${lightboxImage.type}` : ""}
        </div>
      </div>
    </div>,
    document.body
  );
}

