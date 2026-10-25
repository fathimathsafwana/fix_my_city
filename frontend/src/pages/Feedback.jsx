import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

function Feedback() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryIssueId = searchParams.get("issueId") || "";

  const [selectedIssueId, setSelectedIssueId] = useState(queryIssueId);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (queryIssueId) {
      setSelectedIssueId(queryIssueId);
    }
  }, [queryIssueId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      showToast("Please choose a rating between 1 and 5 stars.", "warning");
      return;
    }

    if (!comment.trim()) {
      showToast("Please write your comments and suggestions.", "warning");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          issueId: selectedIssueId || null,
          rating,
          category: "Resolution Quality",
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback.");
      }

      showToast("Thank you! Your feedback has been recorded.", "success");
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Cannot submit feedback.", "error");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="feedback-page-wrapper">
      <Navbar />

      <div className="feedback-container">
        {/* Page Header */}
        <div className="feedback-header-card">
          <h1>Feedback & Rating</h1>
          <p className="feedback-lead">
            Help us improve municipal services. Rate completed works, service quality, or provide suggestions to city authorities.
          </p>
        </div>

        <div className="feedback-layout">
          {/* Feedback Submission Form */}
          <div className="feedback-form-card" style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📝</span> Submit Your Feedback
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/track"))}
                title="Close feedback"
                aria-label="Close"
                style={{
                  fontSize: "18px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.05)",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                ✕
              </button>
            </div>

            {selectedIssueId && (
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Complaint ID: <code style={{ color: "var(--neon)", padding: "2px 6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}>{selectedIssueId}</code>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Ratings */}
              <div className="form-group">
                <label>Ratings</label>
                <div className="feedback-star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-select-btn ${
                        star <= (hoverRating || rating) ? "active" : ""
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} Star`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="star-feedback-label">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Comments and Suggestions */}
              <div className="form-group">
                <label>Comments and Suggestions</label>
                <textarea
                  rows={4}
                  placeholder="Share your comments, experience, or suggestions to improve..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-feedback-submit"
                disabled={submitting}
              >
                {submitting ? "Submitting Feedback..." : "⭐ Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
