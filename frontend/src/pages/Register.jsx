import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";
import { checkPasswordStrength } from "../utils/validation";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pwdAnalysis = checkPasswordStrength(password);
  const showConfirmMismatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword &&
    (confirmTouched || confirmPassword.length >= password.length);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter your full name.");
      setIsError(true);
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    if (!pwdAnalysis.isValid) {
      setMessage(
        "Please create a strong password that meets all requirements (including at least one special character)."
      );
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmTouched(true);
      setMessage("Passwords do not match. Please re-check.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || data.error || "Failed to register user.");
        setIsError(true);
        return;
      }

      setMessage("Account created successfully! Redirecting to login...");
      setIsError(false);

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend server. Please verify your connection.");
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-card">
        <h1>Create Account</h1>

        <p className="login-description">
          Create your FixMyCity account.
        </p>

        <form onSubmit={handleRegister} autoComplete="off">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (message) setMessage("");
              }}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (message) setMessage("");
              }}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (message) setMessage("");
                }}
                autoComplete="new-password"
                required
                style={{
                  width: "100%",
                  paddingRight: "45px",
                }}
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

            {/* Inline Error for Password */}
            {password && !pwdAnalysis.isValid && (
              <div className="field-inline-error">
                <span className="field-inline-error-icon">⚠️</span>
                <span>
                  {pwdAnalysis.errors.length === 1
                    ? `${pwdAnalysis.errors[0]}.`
                    : "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character."}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmTouched(false);
                  if (message) setMessage("");
                }}
                onBlur={() => {
                  if (confirmPassword.length > 0) {
                    setConfirmTouched(true);
                  }
                }}
                autoComplete="new-password"
                required
                style={{
                  width: "100%",
                  paddingRight: "45px",
                }}
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

            {/* Inline Error for Confirm Password */}
            {showConfirmMismatch && (
              <div className="field-inline-error">
                <span className="field-inline-error-icon">⚠️</span>
                <span>Passwords do not match.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <div className={`login-feedback ${isError ? "error" : "success"}`}>
            <div>
              <strong style={{ marginRight: "6px" }}>{isError ? "⚠️" : "✅"}</strong>
              <span>{message}</span>
            </div>
            {isError && message.toLowerCase().includes("already exists") && (
              <Link to="/login" className="login-feedback-link">
                Already registered? Go to Login &rarr;
              </Link>
            )}
          </div>
        )}

        <p className="register-text">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
