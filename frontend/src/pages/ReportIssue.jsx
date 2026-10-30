import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

function ReportIssue() {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const getCurrentLocation = () => {
    if (locating) return;

    if (!navigator.geolocation) {
      setLocationMessage(
        "GPS location is not supported by your browser."
      );
      showToast("GPS location is not supported by your browser.", "error");
      return;
    }

    setLocating(true);
    setLocationMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          latitude: latitude,
          longitude: longitude,
        });

        setLocationMessage("Location found successfully!");
        showToast("GPS Location detected successfully!", "success");
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            "Location permission was denied. Setting approximate city coordinates."
          );
          showToast("Location permission denied. Setting approximate coordinates.", "warning");
        } else {
          setLocationMessage(
            "Unable to get exact GPS. Setting approximate city coordinates."
          );
          showToast("Unable to get exact GPS. Setting approximate coordinates.", "warning");
        }
        setLocation({
          latitude: 11.2588,
          longitude: 75.7804,
        });
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitted) return;

    if (!title || !description) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    if (!location) {
      showToast("Please get your GPS location.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append("title", title);
      formData.append("category", "General");
      formData.append("description", description);
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);

      if (photo) {
        formData.append("photo", photo);
      }

      const headers = getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Backend response:", data);
        const rawId = data.trackingId || data.issue?.trackingId || data.issue?._id || data._id || "";
        const newId = String(rawId).slice(0, 10);
        setTrackingId(newId);
        setSubmitted(true);
        showToast("Civic issue submitted successfully!", "success");
      } else {
        showToast(data.message || "Failed to submit the issue.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Cannot connect to the backend.", "error");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="report-page">
      <Navbar />
      <div className="report-card">

        <h1>Report an Issue</h1>

        <p className="report-description">
          Help improve our community by reporting a civic issue.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Issue Title */}
          <div className="form-group">
            <label>Issue Title</label>

            <input
              type="text"
              placeholder="Example: Street light not working"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>

            <textarea
              placeholder="Describe the issue in detail"
              rows="5"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            ></textarea>
          </div>

          {/* GPS Location */}
          <div className="form-group">
            <label>GPS Location</label>

            <button
              type="button"
              className="location-button"
              onClick={getCurrentLocation}
              disabled={locating}
            >
              {locating ? "⏳ Getting Location..." : "📍 Use My Current Location"}
            </button>

            {/* Location Status Message (single message only) */}
            {location ? (
              <div className="location-result">
                <p>✅ Location captured successfully.</p>
              </div>
            ) : locationMessage ? (
              <p className="location-message">
                {locationMessage}
              </p>
            ) : null}
          </div>

          {/* Photo */}
          <div className="form-group">
            <label>Upload Photo</label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setPhoto(event.target.files[0])
              }
            />

            {photo && (
              <div style={{ marginTop: "10px" }}>
                <p>
                  <strong>Selected Photo:</strong>
                </p>

                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Selected complaint"
                    style={{
                      width: "250px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    title="Remove selected photo"
                    aria-label="Remove photo"
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      background: "rgba(0, 0, 0, 0.75)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 700,
                      transition: "background 0.2s ease",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`report-submit ${submitted ? "submitted" : ""} ${submitting ? "submitting" : ""}`}
            disabled={submitting || submitted}
          >
            {submitting ? (
              <>⏳ Submitting Issue...</>
            ) : submitted ? (
              <>✅ Submitted</>
            ) : (
              "Submit Issue"
            )}
          </button>

        </form>

        {/* Success Message with Tracking ID */}
        {submitted && (
          <div className="success-message">
            <h3>✅ Issue Submitted Successfully!</h3>

            <p style={{ color: "#d1d5db", margin: "8px 0 16px 0" }}>
              Your complaint has been recorded with municipal dispatch. Use your <strong>Tracking ID</strong> to monitor real-time resolution progress.
            </p>

            {trackingId && (
              <div className="tracking-id-banner">
                <div className="tracking-id-info">
                  <span className="tracking-id-label">Tracking ID</span>
                  <code className="tracking-id-code">{trackingId}</code>
                </div>
                <button
                  type="button"
                  className="btn-copy-tracking-id"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingId);
                    showToast("Tracking ID copied to clipboard!", "success");
                  }}
                  title="Copy Tracking ID to clipboard"
                >
                  📋 Copy Tracking ID
                </button>
              </div>
            )}

            <div className="success-action-buttons">
              {trackingId ? (
                <Link
                  to={`/track?id=${trackingId}`}
                  className="btn-track-issue"
                  title="Track this complaint in live tracker"
                >
                  🔍 Track This Issue Live
                </Link>
              ) : (
                <Link
                  to="/track"
                  className="btn-track-issue"
                  title="Go to tracking page"
                >
                  🔍 Go to Track Complaints
                </Link>
              )}

              <button
                type="button"
                className="btn-report-another"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setPhoto(null);
                  setLocation(null);
                  setLocationMessage("");
                  setLocating(false);
                  setSubmitted(false);
                  setTrackingId("");
                }}
              >
                ➕ Report Another Issue
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ReportIssue;