import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Sync user state on route changes or storage updates
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      let parsed = savedUser ? JSON.parse(savedUser) : null;
      if (parsed && parsed.name === "Electrical Department Officer") {
        parsed.name = "Department Officer";
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-link">
        <div className="logo">
          <span className="logo-icon">🏛️</span> FixMyCity
        </div>
      </Link>

      {/* Guest Mode: ONLY TWO buttons (Login and Register) */}
      {!user && (
        <div className="nav-guest-actions">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? "nav-guest-btn active" : "nav-guest-btn"
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? "nav-guest-btn nav-guest-btn-primary active"
                : "nav-guest-btn nav-guest-btn-primary"
            }
          >
            Register
          </NavLink>
        </div>
      )}

      {/* Logged-In User Navigation */}
      {user && (
        <div className="nav-authenticated-wrapper">
          <div className="nav-links">
            {/* Citizen / User Features */}
            {user.role === "user" && (
              <>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  end
                >
                  Home
                </NavLink>

                <NavLink
                  to="/report"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Report Issue
                </NavLink>

                <NavLink
                  to="/track"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Track Complaints
                </NavLink>
              </>
            )}

            {/* Admin Features */}
            {user.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Admin Dashboard
              </NavLink>
            )}

            {/* Department Features */}
            {user.role === "department" && (
              <NavLink
                to="/department"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Department Dashboard
              </NavLink>
            )}
          </div>

          <div className="nav-user-container">
            {/* Direct Link to Profile by clicking on user name */}
            <Link
              to="/profile"
              className={`nav-user-badge ${
                user.role === "admin"
                  ? "admin-badge"
                  : user.role === "department"
                  ? "dept-badge-nav"
                  : "citizen-badge"
              }`}
              title="Click to view My Profile"
            >
              {user.role === "admin"
                ? `🛡️ Admin: ${user.name || "Administrator"}`
                : user.role === "department"
                ? `🏢 ${user.name || "Department Officer"}`
                : `👤 ${user.name || "Citizen"}`}
            </Link>

            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;