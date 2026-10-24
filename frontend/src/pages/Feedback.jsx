import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";

function Feedback() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("Resolution Quality");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const getAuthHeaders = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        const uid = user.id || user._id;
        if (uid) return { "user-id": uid };
      }
    } catch {}
    return {};
  };

  // Fetch user complaints for the dropdown and existing feedback history
  useEffect(() => {
    const headers = getAuthHeaders();

    // 1. Fetch user issues
    fetch("http://localhost:5000/api/issues", { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error loading issues for feedback:", err));

    // 2. Fetch feedback history
    fetchFeedbackHistory();
  }, []);

  const fetchFeedbackHistory = () => {
    const headers = getAuthHeaders();
    setLoadingHistory(true);
    fetch("http://localhost:5000/api/feedback", { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFeedbackHistory(Array.isArray(data) ? data : []);
        setLoadingHistory(false);
      })
      .catch((err) => {
        console.error("Error loading feedback history:", err);
        setLoadingHistory(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      showToast("Please choose a rating between 1 and 5 stars.", "warning");
      return;
    }

    if (!comment.trim()) {
      showToast("Please write a short comment or suggestion.", "warning");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    };

    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          issueId: selectedIssueId || null,
          rating,
          category,
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
      setSelectedIssueId("");
      fetchFeedbackHistory();
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
          <h1>⭐ Citizen Feedback & Rating</h1>
          <p className="feedback-lead">
            Help us improve municipal services. Rate completed works, service quality, or provide suggestions to city authorities.
          </p>
        </div>

        <div className="feedback-layout">
          {/* Left Column: Feedback Submission Form */}
          <div className="feedback-form-card">
            <h2>📝 Submit Your Feedback</h2>

            <form onSubmit={handleSubmit}>
              {/* Select Complaint or General */}
              <div className="form-group">
                <label>Related Complaint / Service</label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                >
                  <option value="">🌐 General Municipal / City Portal Feedback</option>
                  {issues.map((issue) => (
                    <option key={issue._id} value={issue._id}>
                      [{issue.status}] {issue.title} ({issue.category})
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Select a specific complaint you reported or choose general service feedback.
                </small>
              </div>

              {/* Star Rating Picker */}
              <div className="form-group">
                <label>Your Rating</label>
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

              {/* Feedback Category */}
              <div className="form-group">
                <label>Feedback Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Resolution Quality">Resolution Quality</option>
                  <option value="Speed of Resolution">Speed of Resolution</option>
                  <option value="Field Worker Behavior">Field Worker Behavior</option>
                  <option value="Portal Usability">Portal & App Usability</option>
                  <option value="General Civic Suggestion">General Civic Suggestion</option>
                </select>
              </div>

              {/* Comments & Details */}
              <div className="form-group">
                <label>Comments & Suggestions</label>
                <textarea
                  rows={4}
                  placeholder="Share details about your experience, resolution quality, or ideas to improve..."
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

          {/* Right Column: Feedback History */}
          <div className="feedback-history-card">
            <h2>📋 Your Feedback History</h2>
            <p className="history-subtitle">
              Past ratings and reviews submitted from your account.
            </p>

            {loadingHistory && <p className="history-loading">Loading your feedback history...</p>}

            {!loadingHistory && feedbackHistory.length === 0 && (
              <div className="history-empty">
                <span className="empty-icon">💬</span>
                <p>No feedback submitted yet.</p>
                <small>Use the form to rate your first resolved issue or municipal service.</small>
              </div>
            )}

            {!loadingHistory && feedbackHistory.length > 0 && (
              <div className="feedback-history-list">
                {feedbackHistory.map((item) => (
                  <div className="history-item-card" key={item._id}>
                    <div className="history-item-top">
                      <div className="history-stars">
                        {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                        <span className="history-rating-score">({item.rating}/5)</span>
                      </div>
                      <span className="history-category-pill">{item.category}</span>
                    </div>

                    <div className="history-issue-ref">
                      <strong>Target:</strong> {item.issueTitle || "General Service"}
                    </div>

                    <p className="history-comment-quote">"{item.comment}"</p>

                    <div className="history-date">
                      📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;

