import Pagination from "../Pagination";

export default function FeedbacksTab({
  feedbacks = [],
  filteredFeedbacks = [],
  paginatedFeedbacks = [],
  feedbackStats = {},
  loadingFeedbacks = false,
  feedbackSearchQuery = "",
  setFeedbackSearchQuery,
  feedbackPage = 1,
  setFeedbackPage,
  feedbackPageSize = 5,
  setFeedbackPageSize,
  feedbackTotalPages = 1,
  onDeleteFeedback,
}) {
  const renderStarRating = (rating) => {
    const r = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    return (
      <div className="fb-stars-row" title={`${r} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= r ? "fb-star-icon" : "fb-star-empty"}
          >
            ★
          </span>
        ))}
        <span className="fb-rating-badge">{r}.0</span>
      </div>
    );
  };

  return (
    <>
      {/* Feedbacks Toolbar */}
      <div className="complaints-center-toolbar">
        <div className="toolbar-left-controls">
          <div className="toolbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by citizen or comment..."
              value={feedbackSearchQuery}
              onChange={(e) => setFeedbackSearchQuery(e.target.value)}
            />
            {feedbackSearchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setFeedbackSearchQuery("")}
                title="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingFeedbacks && (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading citizen feedback...</p>
        </div>
      )}

      {/* Empty State */}
      {!loadingFeedbacks && filteredFeedbacks.length === 0 && (
        <div className="no-issues-placeholder">
          <div className="empty-state-icon">⭐</div>
          <h3>No Citizen Feedback Found</h3>
          <p>
            {feedbacks.length === 0
              ? "Citizens have not submitted ratings or feedback yet."
              : "No feedback matches your search filter."}
          </p>
          {feedbackSearchQuery && (
            <button
              className="btn-clear-search"
              onClick={() => setFeedbackSearchQuery("")}
              type="button"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* FEEDBACKS CARDS GRID VIEW ONLY */}
      {!loadingFeedbacks && filteredFeedbacks.length > 0 && (
        <div className="dashboard-cards-grid">
          {paginatedFeedbacks.map((fb) => {
            const citizenName = fb.userName || fb.user?.name || "Citizen";
            const citizenEmail = fb.user?.email;

            return (
              <div className="fb-card-pro" key={fb._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div className="user-info-text">
                    <span className="user-fullname">{citizenName}</span>
                    {citizenEmail && (
                      <span className="user-email-text">{citizenEmail}</span>
                    )}
                  </div>
                  {renderStarRating(fb.rating)}
                </div>

                <div className="fb-comment-quote">
                  "{fb.comment}"
                </div>

                <div className="card-controls-footer" style={{ marginTop: "auto", paddingTop: "12px" }}>
                  <span className="card-date">
                    {fb.createdAt
                      ? new Date(fb.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  <button
                    className="btn-action-icon btn-delete-icon"
                    onClick={() => onDeleteFeedback(fb._id, citizenName)}
                    title="Delete Feedback"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedbacks Pagination */}
      {filteredFeedbacks.length > 0 && (
        <Pagination
          currentPage={feedbackPage}
          totalPages={feedbackTotalPages}
          totalItems={filteredFeedbacks.length}
          pageSize={feedbackPageSize}
          onPageChange={setFeedbackPage}
          onPageSizeChange={setFeedbackPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </>
  );
}
