import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRole, allowedRoles, children }) {
  let user = null;
  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }

  // Not logged in -> redirect to login page immediately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const validRoles = allowedRoles || (allowedRole ? [allowedRole] : null);

  // If specific role required and does not match:
  if (validRoles && !validRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "department") {
      return <Navigate to="/department" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;