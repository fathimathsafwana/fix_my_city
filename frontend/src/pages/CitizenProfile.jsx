import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/useToast";
import { API_BASE_URL } from "../config";
import { getCurrentUser } from "../utils/auth";
import { checkPasswordStrength } from "../utils/validation";

function CitizenProfile() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setName(savedUser.name || "");
      fetchUserProfile(savedUser.id || savedUser._id);
    } else {
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

    if (password) {
      const pwdCheck = checkPasswordStrength(password);
      if (!pwdCheck.isValid) {
        showToast(
          "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character.",
          "error"
        );
        return;
      }
      if (password !== confirmPassword) {
        setConfirmTouched(true);
        showToast("Passwords do not match.", "error");
        return;
      }
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
            </div>

            <h1 className="profile-focused-name">{user?.name || "Citizen"}</h1>


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

                {/* Password Change Divider */}
                <div className="profile-divider">
                  <span>Change Password </span>
                </div>

                {/* New Password */}
                <div className="profile-form-group">
                  <label>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password"
                      style={{ width: "100%", paddingRight: "45px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "18px",
                        zIndex: 2,
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {password && !checkPasswordStrength(password).isValid && (
                    <div className="field-inline-error">
                      <span className="field-inline-error-icon">⚠️</span>
                      <span>
                        {checkPasswordStrength(password).errors.length === 1
                          ? `${checkPasswordStrength(password).errors[0]}.`
                          : "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                {password && (
                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmTouched(false);
                        }}
                        onBlur={() => {
                          if (confirmPassword.length > 0) {
                            setConfirmTouched(true);
                          }
                        }}
                        placeholder="Re-type new password"
                        required
                        autoComplete="new-password"
                        style={{ width: "100%", paddingRight: "45px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          zIndex: 2,
                        }}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {confirmPassword &&
                      password !== confirmPassword &&
                      (confirmTouched || confirmPassword.length >= password.length) && (
                        <div className="field-inline-error">
                          <span className="field-inline-error-icon">⚠️</span>
                          <span>Passwords do not match.</span>
                        </div>
                    )}
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
