import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();


    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed with response:", data);
        setMessage(data.error ? `${data.message} Reason: ${data.error}` : data.message);
        return;
      }

      setMessage("Login successful!");

      console.log("Logged in user:", data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "department") {
        navigate("/department");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-card">

        <h1>Login</h1>

        <p className="login-description">
          Login to access your FixMyCity account.
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                e.target.setCustomValidity("");
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
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
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit">
            Login
          </button>

        </form>

        {message && (
          <div
            className={`login-feedback ${
              message.toLowerCase().includes("successful") ? "success" : "error"
            }`}
          >
            <div>
              <strong style={{ marginRight: "6px" }}>
                {message.toLowerCase().includes("successful") ? "✅" : "⚠️"}
              </strong>
              <span>{message}</span>
            </div>
          </div>
        )}

        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register">Signup</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;