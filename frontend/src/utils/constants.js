/**
 * Shared Civic Issue Categories and Helper Functions
 */

export const CATEGORIES = [
  "Electricity & Street Lighting",
  "Sanitation & Waste Management",
  "Roads & Infrastructure",
  "Water Supply & Drainage",
  "Public Safety",
  "General Civic Grievance",
  "Road / Pothole",
  "Street Light",
  "Garbage / Waste",
  "Water Supply",
  "Drainage",
  "Other",
];

export function getCategoryIcon(category) {
  if (!category) return "⚠️";
  const lower = category.toLowerCase();
  if (lower.includes("road") || lower.includes("pothole")) return "🚧";
  if (lower.includes("light") || lower.includes("electric")) return "💡";
  if (lower.includes("garbage") || lower.includes("waste") || lower.includes("sanitat")) return "🗑️";
  if (lower.includes("water") || lower.includes("supply")) return "🚰";
  if (lower.includes("drainage") || lower.includes("sewage")) return "🌊";
  if (lower.includes("safety") || lower.includes("public")) return "🚨";
  return "📍";
}

export function getDeptIcon(name) {
  if (!name) return "🏢";
  const lower = name.toLowerCase();
  if (lower.includes("electr") || lower.includes("light")) return "⚡";
  if (lower.includes("water") || lower.includes("drain")) return "🚰";
  if (lower.includes("road") || lower.includes("infra")) return "🚧";
  if (lower.includes("sanitat") || lower.includes("waste") || lower.includes("garbage")) return "🗑️";
  return "🏢";
}

export function getStatusClass(status) {
  const s = (!status || status === "Submitted") ? "pending" : status;
  return `status-${s.toLowerCase().replace(/\s+/g, "-")}`;
}

export function getPhotoUrl(path, apiBaseUrl = "") {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
}

