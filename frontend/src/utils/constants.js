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
  return "";
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

export function getIssueCategory(issue, departments = []) {
  if (!issue) return "General";
  if (issue.category && issue.category !== "General") {
    return issue.category;
  }
  const t = (issue.title || "").toLowerCase();
  if (t.includes("light") || t.includes("lamp") || t.includes("electric")) return "Street Light";
  if (t.includes("pothole") || t.includes("road") || t.includes("tar") || t.includes("street")) return "Road / Pothole";
  if (t.includes("garbage") || t.includes("waste") || t.includes("trash") || t.includes("dump")) return "Garbage / Waste";
  if (t.includes("water") || t.includes("leak") || t.includes("pipe")) return "Water Supply";
  if (t.includes("drain") || t.includes("sewer") || t.includes("flood")) return "Drainage";
  if (t.includes("safety") || t.includes("danger") || t.includes("crime")) return "Public Safety";

  if (typeof issue.department === "object" && issue.department !== null && issue.department.name) {
    return issue.department.name;
  }
  const deptId = typeof issue.department === "object" && issue.department !== null ? issue.department._id : issue.department;
  if (deptId && Array.isArray(departments) && departments.length > 0) {
    const dept = departments.find((d) => String(d._id) === String(deptId));
    if (dept && dept.name) return dept.name;
  }

  return issue.category || "General";
}

