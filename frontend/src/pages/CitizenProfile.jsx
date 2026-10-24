import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";

function CitizenProfile() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setName(parsed.name || "");
        fetchUserProfile(parsed.id || parsed._id);
      } else {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    setLoading(true);
    try {
      if (userId) {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
        if (res.ok) {
          const fresh = await res.json();
          setUser((prev) => ({ ...prev, ...fresh }));
          setName(fresh.name || "");
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Name cannot be empty.", "warning");
      return;
    }

    if (password && password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setSaving(true);
    try {
      const userId = user.id || user._id;
      const payload = { name: name.trim() };
      if (password) {
        payload.password = password;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      // Update local storage and component state
      const updatedUser = { ...user, name: name.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPassword("");
      setConfirmPassword("");

      showToast("Profile information updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Cannot update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    if (role === "admin") return "🛡️ Master Administrator";
    if (role === "department") return "🏢 Department Officer";
    return "👤 Citizen Reporter";
  };

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container profile-container-focused">
        {/* User Profile Card */}
        <div className="profile-focused-card">
          {/* Header Banner & Avatar */}
          <div className="profile-focused-header">
            <div className="profile-focused-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
              <span className="profile-online-badge" title="Active Account" />
            </div>

            <h1 className="profile-focused-name">{user?.name || "Citizen"}</h1>

            <div className="profile-focused-badges">
              <span className="profile-role-pill">
                {getRoleLabel(user?.role)}
              </span>
              <span className="profile-status-pill">
                ● Active
              </span>
            </div>

            <p className="profile-focused-email">✉️ {user?.email}</p>
          </div>

          {/* Profile Information Form */}
          <div className="profile-focused-body">
            <div className="profile-card-header">
              <h2 className="profile-card-title">👤 Profile Information</h2>
              <p className="profile-card-subtitle">
                View and manage your account information and credentials
              </p>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
                Loading profile...
              </p>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                {/* Full Name */}
                <div className="profile-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="profile-form-group">
                  <label>Email Address</label>
                  <div className="profile-input-readonly-wrap">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      title="Email address is fixed as your unique account ID"
                    />
              
                  </div>
                </div>

                {/* Account Role */}
                <div className="profile-form-group">
                  <label>Account Role</label>
                  <input
                    type="text"
                    value={getRoleLabel(user?.role)}
                    disabled
                    style={{ opacity: 0.75, cursor: "not-allowed" }}
                  />
                </div>

                {/* Password Change Divider */}
                <div className="profile-divider">
                  <span>Change Password </span>
                </div>

                {/* New Password */}
                <div className="profile-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirm Password */}
                {password && (
                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="profile-form-actions" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    className="profile-btn-submit"
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : "💾 Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenProfile;
