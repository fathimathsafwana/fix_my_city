import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

function Feedback() {
  const { showToast } = useToast();
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
        return "⭐⭐⭐⭐⭐ Excellent (5/5)";
      case 4:
        return "⭐⭐⭐⭐ Very Good (4/5)";
      case 3:
        return "⭐⭐⭐ Good / Average (3/5)";
      case 2:
        return "⭐⭐ Needs Improvement (2/5)";
      case 1:
        return "⭐ Poor (1/5)";
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
          <div className="feedback-form-card">
            <h2>📝 Submit Your Feedback</h2>

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
