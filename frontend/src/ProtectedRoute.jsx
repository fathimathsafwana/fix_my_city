import { Navigate } from "react-router-dom";
import { getCurrentUser } from "./utils/auth";

function ProtectedRoute({ allowedRole, allowedRoles, children }) {
  const user = getCurrentUser();

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