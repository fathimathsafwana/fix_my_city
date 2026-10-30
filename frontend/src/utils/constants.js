/**
 * Shared Civic Issue Categories and Helper Functions
 */

export const CATEGORIES = [
  "Sanitation & Waste Management",
  "Roads & Infrastructure",
  "Water Supply & Drainage",
];

export function getCategoryIcon(category) {
  if (!category) return "🏢";
  const lower = category.toLowerCase();
  if (lower.includes("road") || lower.includes("pothole") || lower.includes("infrastruct") || lower.includes("asphalt")) return "🚧";
  if (lower.includes("garbage") || lower.includes("waste") || lower.includes("sanitat") || lower.includes("clean") || lower.includes("trash")) return "🗑️";
  if (lower.includes("water") || lower.includes("drainage") || lower.includes("supply") || lower.includes("leak") || lower.includes("sewage")) return "🚰";
  if (lower.includes("electr") || lower.includes("light") || lower.includes("power") || lower.includes("wiring")) return "⚡";
  if (lower.includes("plumb")) return "🔧";
  if (lower.includes("safe") || lower.includes("police") || lower.includes("fire") || lower.includes("security")) return "🚨";
  return "🏢";
}

export function getDeptIcon(name) {
  return getCategoryIcon(name);
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

export function getTrackingId(issue) {
  if (!issue) return "";
  const raw = issue.trackingId || (typeof issue === "string" ? issue : issue._id || issue.id || "");
  return String(raw).slice(0, 10);
}

export function getIssueCategory(issue, departments = []) {
  if (!issue) return "Sanitation & Waste Management";

  // If department object is already populated
  if (typeof issue.department === "object" && issue.department !== null && issue.department.name) {
    return issue.department.name;
  }

  // If department ID can be looked up from list
  const deptId = typeof issue.department === "object" && issue.department !== null ? issue.department._id : issue.department;
  if (deptId && Array.isArray(departments) && departments.length > 0) {
    const dept = departments.find((d) => String(d._id) === String(deptId));
    if (dept && dept.name) return dept.name;
  }

  const raw = ((issue.category || "") + " " + (issue.title || "")).toLowerCase();
  if (raw.includes("garbage") || raw.includes("waste") || raw.includes("trash") || raw.includes("dump") || raw.includes("sanitat")) {
    return "Sanitation & Waste Management";
  }
  if (raw.includes("road") || raw.includes("pothole") || raw.includes("tar") || raw.includes("street") || raw.includes("asphalt") || raw.includes("infrastruct")) {
    return "Roads & Infrastructure";
  }
  if (raw.includes("water") || raw.includes("leak") || raw.includes("pipe") || raw.includes("drain") || raw.includes("sewer") || raw.includes("flood")) {
    return "Water Supply & Drainage";
  }

  if (issue.category && CATEGORIES.includes(issue.category)) {
    return issue.category;
  }

  return "Sanitation & Waste Management";
}

