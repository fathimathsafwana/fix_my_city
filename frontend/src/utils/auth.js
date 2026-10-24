/**
 * Shared Authentication Helper Utilities
 */

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function getAuthHeaders() {
  const user = getCurrentUser();
  if (user && (user.id || user._id)) {
    return { "user-id": user.id || user._id };
  }
  return {};
}

