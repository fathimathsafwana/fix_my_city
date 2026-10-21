import { useState, useCallback } from "react";
import { ToastContext } from "./toastContextDef";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let icon = "ℹ️";
          if (toast.type === "success") icon = "✅";
          else if (toast.type === "warning") icon = "⚠️";
          else if (toast.type === "error") icon = "❌";

          return (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.type || "info"}`}
              role="alert"
            >
              <span className="toast-icon">{icon}</span>
              <span className="toast-message">{toast.message}</span>
              <button
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                type="button"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
