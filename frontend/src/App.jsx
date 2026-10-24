import "./App.css";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportIssue from "./pages/ReportIssue";
import { Routes, Route, useNavigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import TrackComplaint from "./pages/TrackComplaint";
import AdminDashboard from "./pages/AdminDashboard";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import CitizenProfile from "./pages/CitizenProfile";
import Feedback from "./pages/Feedback";
import { useState, useEffect } from "react";
import { getCurrentUser } from "./utils/auth";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="content">
          <div className="portal-badge">
            {user?.role === "department"
              ? user?.department?.name
                ? `🏢 ${user.department.name} Portal`
                : "🏢 Municipal Operations Portal"
              : user?.role === "admin"
              ? "🛡️ Master Administrative Portal"
              : "🏛️ Municipal Citizen Portal"}
          </div>

          <h1 className="title">
            <span className="portal-brand-highlight">FixMyCity</span>
          </h1>

          <p className="portal-subheading">
            {user?.role === "department"
              ? `Welcome, ${user.name || "Department Officer"}`
              : "Smart Civic Issue Reporting & Resolution Portal"}
          </p>

          <p className="description">
            {user?.role === "department"
              ? "FixMyCity Operations allows official department staff to monitor, inspect, and resolve civic complaints reported by citizens across the municipality with verified photo proof."
              : "FixMyCity empowers citizens to report civic grievances like broken street lights, potholes, garbage overflows, and water supply issues directly to municipal departments with real-time GPS tracking."}
          </p>

          <div className="button-group">
            {/* If user is logged in, show action buttons based on role */}
            {user ? (
              user.role === "admin" ? (
                <button
                  className="btn report-btn"
                  onClick={() => navigate("/admin")}
                >
                  🛡️ Open Admin Dashboard
                </button>
              ) : user.role === "department" ? (
                <button
                  className="btn report-btn"
                  onClick={() => navigate("/department")}
                >
                  🏢 Open Department Dashboard
                </button>
              ) : (
                <>
                  <button
                    className="btn report-btn"
                    onClick={() => navigate("/report")}
                  >
                    📝 Report an Issue
                  </button>

                  <button
                    className="btn login-btn"
                    onClick={() => navigate("/track")}
                  >
                    🔍 Track Complaints
                  </button>
                </>
              )
            ) : (
              /* If not logged in: only direct to Login / Register */
              <>
                <button
                  className="btn report-btn"
                  onClick={() => navigate("/login")}
                >
                   Login
                </button>

                <button
                  className="btn login-btn"
                  onClick={() => navigate("/register")}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>

        <p className="section-description">
          Report a civic problem and follow it through resolution step-by-step.
        </p>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>1. Register & Login</h3>
            <p>
              Create your citizen profile or log in to access the civic reporting services.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>2. Report with GPS</h3>
            <p>
              Submit an issue with description, category, photo proof, and auto-detected GPS coordinates.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>3. Admin Assigns</h3>
            <p>
              Admin verify the complaint and dispatch it to the responsible municipal department.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>4. Track Resolution</h3>
            <p>
              Department resolves the problem and citizens can track the status live until closed.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen / User Protected Routes */}
      <Route
        path="/report"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "department"]}>
            <ReportIssue />
          </ProtectedRoute>
        }
      />

      <Route
        path="/track"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "department"]}>
            <TrackComplaint />
          </ProtectedRoute>
        }
      />

      {/* Citizen Feedback & Rating Route */}
      <Route
        path="/feedback"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "department"]}>
            <Feedback />
          </ProtectedRoute>
        }
      />

      {/* Citizen Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "department"]}>
            <CitizenProfile />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Department Protected Route */}
      <Route
        path="/department"
        element={
          <ProtectedRoute allowedRole="department">
            <DepartmentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback to Home */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;