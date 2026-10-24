import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/useToast";
import Pagination from "../components/Pagination";
import { API_BASE_URL } from "../config";

function AdminDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Primary Tab: 'complaints' | 'users'
  const [activeTab, setActiveTab] = useState("complaints");

  // Complaints States
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  // View, Edit & Delete Complaint Action States
  const [viewingIssue, setViewingIssue] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "",
    description: "",
    status: "Submitted",
    department: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Complaints Pagination
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [complaintsPageSize, setComplaintsPageSize] = useState(5);

  // Department Creation State
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptData, setNewDeptData] = useState({
    name: "",
    description: "",
    email: "",
    password: "",
  });

  // Department Management States
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [departmentsPage, setDepartmentsPage] = useState(1);
  const [departmentsPageSize, setDepartmentsPageSize] = useState(5);
  const [viewingDept, setViewingDept] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [editDeptData, setEditDeptData] = useState({
    name: "",
    description: "",
    email: "",
    password: "",
  });
  const [savingDept, setSavingDept] = useState(false);
  const [showDeptPassword, setShowDeptPassword] = useState(false);
  const [showEditDeptPassword, setShowEditDeptPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Users States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [viewingUser, setViewingUser] = useState(null);

  // Users Pagination
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(5);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  // Feedbacks & Reviews States
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("All");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(6);

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState("table");

  // Lightbox Modal for photo inspection
  const [lightboxImage, setLightboxImage] = useState(null);

  // Sidebar controls
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Current logged in user from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    showToast("Signed out successfully.", "info");
    navigate("/login");
  };

  const getAuthHeaders = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user && (user.id || user._id)) {
        return { "user-id": user.id || user._id };
      }
    } catch {
      // ignore
    }
    return {};
  };

  const fetchIssues = () => {
    fetch(`${API_BASE_URL}/api/issues`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching issues:", error);
        setLoading(false);
      });
  };

  const fetchDepartments = () => {
    fetch(`${API_BASE_URL}/api/departments`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((data) => {
        setDepartments(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  };

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setLoadingUsers(false);
      });
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch feedback.");
      const data = await response.json();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchDepartments();
    fetchUsers();
    fetchFeedbacks();
  }, []);

  // Complaint handlers
  const handleStatusChange = async (issueId, newStatus) => {
    setUpdatingId(issueId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");
      const data = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId ? (data.issue ? data.issue : { ...item, status: newStatus }) : item
        )
      );
      showToast(`Status updated to "${newStatus}"`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update complaint status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDepartmentChange = async (issueId, departmentId) => {
    setUpdatingId(issueId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues/${issueId}/department`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ department: departmentId || null }),
        }
      );

      if (!response.ok) throw new Error("Failed to assign department");
      const data = await response.json();

      setIssues((currentIssues) =>
        currentIssues.map((item) =>
          item._id === issueId ? (data.issue ? data.issue : { ...item, department: departmentId }) : item
        )
      );

      const deptName =
        departments.find((d) => d._id === departmentId)?.name || "Unassigned";
      showToast(`Department assigned: ${deptName}`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to assign department.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // User Management Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      showToast("Please fill in name, email, and password.", "warning");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create user.");
      }

      setUsers((prev) => [data.user, ...prev]);
      showToast(`User ${data.user.name} created successfully!`, "success");
      setIsCreateModalOpen(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "user",
      });
    } catch (err) {
      showToast(err.message || "Failed to create user.", "error");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptData.name.trim()) {
      showToast("Please enter a department name.", "error");
      return;
    }
    if (!newDeptData.description.trim()) {
      showToast("Please enter a department description.", "error");
      return;
    }
    if (!newDeptData.email.trim()) {
      showToast("Please enter an official department email.", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDeptData.email.trim())) {
      showToast("Please enter a valid email address with a domain (e.g. sanitation@fixmycity.com).", "error");
      return;
    }
    if (!newDeptData.password.trim()) {
      showToast("Please enter an account password for the department.", "error");
      return;
    }

    setCreatingDept(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newDeptData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create department.");
      }

      setDepartments((prev) => [...prev, data.department]);
      showToast(`Department "${data.department.name}" & login account created!`, "success");
      setIsCreateDeptModalOpen(false);
      setNewDeptData({ name: "", description: "", email: "", password: "" });
      fetchDepartments();
      fetchUsers();
    } catch (err) {
      showToast(err.message || "Failed to create department.", "error");
    } finally {
      setCreatingDept(false);
    }
  };

  const handleOpenEditModal = (issue) => {
    setEditingIssue(issue);
    setEditFormData({
      title: issue.title || "",
      category: issue.category || "General",
      description: issue.description || "",
      status: issue.status || "Submitted",
      department:
        (typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department) || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingIssue) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${editingIssue._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update complaint.");
      }

      setIssues((prev) =>
        prev.map((i) =>
          i._id === editingIssue._id
            ? (data.issue || {
                ...i,
                ...editFormData,
                department: departments.find((d) => d._id === editFormData.department) || editFormData.department,
              })
            : i
        )
      );
      showToast("Complaint updated successfully!", "success");
      setEditingIssue(null);
    } catch (err) {
      showToast(err.message || "Failed to update complaint.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteIssue = async (issueId, issueTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete complaint "${issueTitle || issueId}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete complaint.");
      }

      setIssues((prev) => prev.filter((i) => i._id !== issueId));
      showToast("Complaint deleted successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete complaint.", "error");
    }
  };

  const handleOpenEditDept = (dept) => {
    setEditingDept(dept);
    setEditDeptData({
      name: dept.name || "",
      description: dept.description || "",
      email: dept.email || "",
      password: "",
    });
  };

  const handleSaveEditDept = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!editDeptData.name.trim()) {
      showToast("Please enter a department name.", "error");
      return;
    }
    if (!editDeptData.description.trim()) {
      showToast("Please enter a department description.", "error");
      return;
    }

    setSavingDept(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${editingDept._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editDeptData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update department.");
      }

      setDepartments((prev) =>
        prev.map((d) => (d._id === editingDept._id ? data.department : d))
      );
      showToast(`Department "${data.department.name}" updated successfully!`, "success");
      setEditingDept(null);
      fetchDepartments();
      fetchIssues();
    } catch (err) {
      showToast(err.message || "Failed to update department.", "error");
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the department "${name}"?\n\nAny issues or staff assigned to this department will be unassigned.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete department.");
      }

      setDepartments((prev) => prev.filter((d) => d._id !== id));
      showToast(data.message || "Department deleted.", "success");
      fetchDepartments();
      fetchIssues();
      fetchUsers();
    } catch (err) {
      showToast(err.message || "Failed to delete department.", "error");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const payload = { role: newRole };

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update user.");

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? data.user : u))
      );
      showToast(`User updated successfully!`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update user.", "error");
    }
  };

  const handleToggleBlockUser = async (user) => {
    const nextStatus = !user.isBlocked;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user._id}/block`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${nextStatus ? "block" : "unblock"} user.`);
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isBlocked: nextStatus } : u))
      );
      if (viewingUser && viewingUser._id === user._id) {
        setViewingUser((prev) => ({ ...prev, isBlocked: nextStatus }));
      }

      showToast(
        nextStatus
          ? `Citizen "${user.name}" has been blocked.`
          : `Citizen "${user.name}" has been unblocked.`,
        nextStatus ? "warning" : "success"
      );
    } catch (err) {
      showToast(err.message || `Failed to update citizen block status.`, "error");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user.");

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showToast(`User "${userName}" deleted successfully.`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete user.", "error");
    }
  };

  const handleDeleteFeedback = async (id, citizenName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this feedback from "${citizenName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete feedback.");
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      showToast("Citizen feedback deleted successfully.", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete feedback.", "error");
    }
  };

  // Complaint counts & filtering
  const deptIssueCounts = useMemo(() => {
    const counts = { unassigned: 0 };
    issues.forEach((issue) => {
      const deptId =
        typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department;
      if (deptId) {
        counts[String(deptId)] = (counts[String(deptId)] || 0) + 1;
      } else {
        counts.unassigned += 1;
      }
    });
    return counts;
  }, [issues]);

  const currentDept = useMemo(() => {
    if (departmentFilter === "All" || departmentFilter === "Unassigned") return null;
    return departments.find((d) => String(d._id) === String(departmentFilter));
  }, [departments, departmentFilter]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        searchQuery === "" ||
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || issue.status === statusFilter;

      const issueDeptId =
        typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department;

      const matchesDept =
        departmentFilter === "All" ||
        (departmentFilter === "Unassigned" && !issueDeptId) ||
        String(issueDeptId) === String(departmentFilter);

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [issues, searchQuery, statusFilter, departmentFilter]);

  const complaintStats = useMemo(() => {
    const relevant =
      departmentFilter === "All"
        ? issues
        : departmentFilter === "Unassigned"
        ? issues.filter((i) => {
            const dId =
              typeof i.department === "object" && i.department !== null
                ? i.department._id
                : i.department;
            return !dId;
          })
        : issues.filter((i) => {
            const dId =
              typeof i.department === "object" && i.department !== null
                ? i.department._id
                : i.department;
            return String(dId) === String(departmentFilter);
          });

    return {
      total: relevant.length,
      submitted: relevant.filter((i) => i.status === "Submitted").length,
      verified: relevant.filter((i) => i.status === "Verified").length,
      inProgress: relevant.filter(
        (i) => i.status === "In Progress" || i.status === "Assigned"
      ).length,
      resolved: relevant.filter((i) => i.status === "Resolved").length,
    };
  }, [issues, departmentFilter]);

  // User Stats & Filtering (Citizens only; Admin & Department accounts managed separately)
  const userStats = useMemo(() => {
    const manageableUsers = users.filter((u) => u.role !== "department" && u.role !== "admin");
    return {
      total: manageableUsers.length,
      active: manageableUsers.filter((u) => !u.isBlocked).length,
      blocked: manageableUsers.filter((u) => u.isBlocked).length,
      citizens: manageableUsers.filter((u) => u.role === "user").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.role !== "department" && u.role !== "admin")
      .filter((u) => {
        const query = userSearchQuery.toLowerCase();
        return (
          query === "" ||
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
        );
      });
  }, [users, userSearchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setComplaintsPage(1);
  }, [departmentFilter, statusFilter, searchQuery]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearchQuery]);

  // Paginated Complaints
  const totalComplaintsPages = Math.ceil(filteredIssues.length / complaintsPageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (complaintsPage - 1) * complaintsPageSize;
    return filteredIssues.slice(start, start + complaintsPageSize);
  }, [filteredIssues, complaintsPage, complaintsPageSize]);

  // Paginated Users
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * usersPageSize;
    return filteredUsers.slice(start, start + usersPageSize);
  }, [filteredUsers, usersPage, usersPageSize]);

  // Filtered & Paginated Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const query = deptSearchQuery.toLowerCase();
      return (
        query === "" ||
        d.name?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      );
    });
  }, [departments, deptSearchQuery]);

  useEffect(() => {
    setDepartmentsPage(1);
  }, [deptSearchQuery]);

  const totalDepartmentsPages =
    Math.ceil(filteredDepartments.length / departmentsPageSize) || 1;
  const paginatedDepartments = useMemo(() => {
    const start = (departmentsPage - 1) * departmentsPageSize;
    return filteredDepartments.slice(start, start + departmentsPageSize);
  }, [filteredDepartments, departmentsPage, departmentsPageSize]);

  const getCategoryIcon = (category) => {
    if (!category) return "⚠️";
    const lower = category.toLowerCase();
    if (lower.includes("road") || lower.includes("pothole")) return "🚧";
    if (lower.includes("light")) return "💡";
    if (lower.includes("garbage") || lower.includes("waste")) return "🗑️";
    if (lower.includes("water")) return "🚰";
    if (lower.includes("drainage")) return "🌊";
    if (lower.includes("safety") || lower.includes("public")) return "🚨";
    return "📍";
  };

  const getDeptIcon = (name) => {
    if (!name) return "🏢";
    const lower = name.toLowerCase();
    if (lower.includes("electr") || lower.includes("light")) return "⚡";
    if (lower.includes("water") || lower.includes("drain")) return "🚰";
    if (lower.includes("road") || lower.includes("infra")) return "🚧";
    if (lower.includes("sanitat") || lower.includes("waste") || lower.includes("garbage")) return "🗑️";
    return "🏢";
  };

  const getStatusClass = (status) => {
    return `status-${(status || "submitted").toLowerCase().replace(/\s+/g, "-")}`;
  };

  const getPhotoUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${API_BASE_URL}${path}`;
  };

  // Feedback Statistics
  const feedbackStats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return { total: 0, avgRating: "0.0", count5: 0, count4: 0, count3: 0, count2: 0, count1: 0, satisfactionRate: 0 };
    }
    let sum = 0;
    let count5 = 0;
    let count4 = 0;
    let count3 = 0;
    let count2 = 0;
    let count1 = 0;

    feedbacks.forEach((f) => {
      const r = Number(f.rating) || 0;
      sum += r;
      if (r === 5) count5++;
      else if (r === 4) count4++;
      else if (r === 3) count3++;
      else if (r === 2) count2++;
      else if (r === 1) count1++;
    });

    const avgRating = (sum / total).toFixed(1);
    const satisfactionRate = Math.round(((count5 + count4) / total) * 100);

    return { total, avgRating, count5, count4, count3, count2, count1, satisfactionRate };
  }, [feedbacks]);

  // Filtered & Paginated Feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (feedbackRatingFilter !== "All") {
        if (Number(f.rating) !== Number(feedbackRatingFilter)) return false;
      }

      if (feedbackSearchQuery.trim()) {
        const query = feedbackSearchQuery.toLowerCase();
        const cName = (f.userName || f.user?.name || "").toLowerCase();
        const cEmail = (f.user?.email || "").toLowerCase();
        const cComment = (f.comment || "").toLowerCase();
        const cIssue = (f.issueTitle || "").toLowerCase();
        const cCategory = (f.category || "").toLowerCase();

        return (
          cName.includes(query) ||
          cEmail.includes(query) ||
          cComment.includes(query) ||
          cIssue.includes(query) ||
          cCategory.includes(query)
        );
      }

      return true;
    });
  }, [feedbacks, feedbackRatingFilter, feedbackSearchQuery]);

  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (feedbackPage - 1) * feedbackPageSize;
    return filteredFeedbacks.slice(startIndex, startIndex + feedbackPageSize);
  }, [filteredFeedbacks, feedbackPage, feedbackPageSize]);

  const feedbackTotalPages = Math.ceil(filteredFeedbacks.length / feedbackPageSize) || 1;

  const renderStarRating = (rating) => {
    const r = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    return (
      <div className="fb-stars-row" title={`${r} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= r ? "fb-star-icon" : "fb-star-empty"}
          >
            ★
          </span>
        ))}
        <span className="fb-rating-badge">{r}.0</span>
      </div>
    );
  };

  return (
    <div className="dept-sidebar-layout admin-sidebar-theme">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="dept-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Lightbox Photo Preview Modal */}
      {lightboxImage && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-lightbox-close-btn"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.title || "Proof"} />
            <div className="image-lightbox-caption">
              {lightboxImage.title} • {lightboxImage.type}
            </div>
          </div>
        </div>
      )}

      {/* View User / Citizen Modal */}
      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  className={`user-avatar-circle role-${viewingUser.role}`}
                  style={{ width: "42px", height: "42px", fontSize: "18px" }}
                >
                  {viewingUser.name ? viewingUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0 }}>
                    {viewingUser.name || "Citizen Account"}
                  </h2>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    ID: #{viewingUser._id}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setViewingUser(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Email Address
                  </label>
                  <div style={{ fontSize: "13.5px", color: "#38bdf8", fontWeight: 600 }}>
                    ✉️ {viewingUser.email}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Account Status
                  </label>
                  <div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: viewingUser.isBlocked ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                        color: viewingUser.isBlocked ? "#f87171" : "#4ade80",
                        border: `1px solid ${viewingUser.isBlocked ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                      }}
                    >
                      {viewingUser.isBlocked ? "🔴 Blocked" : "🟢 Active"}
                    </span>
                  </div>
                </div>
              </div>

              {viewingUser.role === "department" && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Assigned Municipal Department
                  </label>
                  <div style={{ fontSize: "13.5px", color: "#a855f7", fontWeight: 600 }}>
                    🏢{" "}
                    {typeof viewingUser.department === "object" && viewingUser.department !== null
                      ? viewingUser.department.name
                      : departments.find((d) => d._id === viewingUser.department)?.name || "Unassigned"}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Registered: {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : "Active"}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => handleToggleBlockUser(viewingUser)}
                    style={{
                      color: viewingUser.isBlocked ? "#4ade80" : "#f87171",
                      borderColor: viewingUser.isBlocked ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    {viewingUser.isBlocked ? "🔓 Unblock Citizen" : "🚫 Block Citizen"}
                  </button>
                  <button
                    type="button"
                    className="btn-modal-submit"
                    onClick={() => setViewingUser(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {isCreateDeptModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsCreateDeptModalOpen(false)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">🏢 Create New Department</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateDeptModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="modal-form">
              <div className="modal-form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Parks & Recreation, Traffic Management"
                  required
                  value={newDeptData.name}
                  onChange={(e) =>
                    setNewDeptData({ ...newDeptData, name: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Department Responsibilities & Description *</label>
                <textarea
                  placeholder="e.g. Oversight and maintenance of municipal public works, parks and recreation facilities"
                  required
                  rows="3"
                  style={{
                    background: "#0d1117",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                  value={newDeptData.description}
                  onChange={(e) =>
                    setNewDeptData({ ...newDeptData, description: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Department Login Email *</label>
                <input
                  type="email"
                  placeholder="e.g. sanitation@fixmycity.gov"
                  required
                  value={newDeptData.email}
                  onChange={(e) =>
                    setNewDeptData({ ...newDeptData, email: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Department Login Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showDeptPassword ? "text" : "password"}
                    placeholder="Set initial password for department login"
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                    value={newDeptData.password}
                    onChange={(e) =>
                      setNewDeptData({ ...newDeptData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeptPassword(!showDeptPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: 0,
                    }}
                    title={showDeptPassword ? "Hide password" : "Show password"}
                  >
                    {showDeptPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsCreateDeptModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={creatingDept}
                >
                  {creatingDept ? "Creating..." : "🏢 Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Department Details Modal */}
      {viewingDept && (
        <div className="modal-overlay" onClick={() => setViewingDept(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>{getDeptIcon(viewingDept.name)}</span>
                <div>
                  <h2 className="modal-title" style={{ margin: 0 }}>
                    {viewingDept.name}
                  </h2>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    ID: #{viewingDept._id}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setViewingDept(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Description
                </label>
                <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", background: "rgba(0,0,0,0.25)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {viewingDept.description || "No description provided."}
                </div>
              </div>

              {viewingDept.email && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Official Login Email
                  </label>
                  <div style={{ fontSize: "14px", color: "#38bdf8", fontWeight: 600 }}>
                    📧 {viewingDept.email}
                  </div>
                </div>
              )}

              {/* Assigned Complaints Statistic */}
              <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  Assigned Complaints
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>
                  {issues.filter((i) => (typeof i.department === "object" && i.department !== null ? i.department._id : i.department) === viewingDept._id).length}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Created: {viewingDept.createdAt ? new Date(viewingDept.createdAt).toLocaleDateString() : "Active"}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      const deptToEdit = viewingDept;
                      setViewingDept(null);
                      handleOpenEditDept(deptToEdit);
                    }}
                  >
                    ✏️ Edit Department
                  </button>
                  <button
                    type="button"
                    className="btn-modal-submit"
                    onClick={() => setViewingDept(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="modal-overlay" onClick={() => setEditingDept(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Department</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditingDept(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditDept} className="modal-form">
              <div className="modal-form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  required
                  value={editDeptData.name}
                  onChange={(e) =>
                    setEditDeptData({ ...editDeptData, name: e.target.value })
                  }
                  placeholder="e.g. Roads & Bridges"
                />
              </div>

              <div className="modal-form-group">
                <label>Description & Scope *</label>
                <textarea
                  rows="3"
                  required
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                  value={editDeptData.description}
                  onChange={(e) =>
                    setEditDeptData({ ...editDeptData, description: e.target.value })
                  }
                  placeholder="Describe scope, responsibilities..."
                />
              </div>

              <div className="modal-form-group">
                <label>Department Login Email</label>
                <input
                  type="email"
                  placeholder="e.g. sanitation@fixmycity.gov"
                  value={editDeptData.email}
                  onChange={(e) =>
                    setEditDeptData({ ...editDeptData, email: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Reset Password (leave blank to keep current)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showEditDeptPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    style={{ width: "100%", paddingRight: "45px" }}
                    value={editDeptData.password}
                    onChange={(e) =>
                      setEditDeptData({ ...editDeptData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditDeptPassword(!showEditDeptPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: 0,
                    }}
                    title={showEditDeptPassword ? "Hide password" : "Show password"}
                  >
                    {showEditDeptPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditingDept(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={savingDept}
                >
                  {savingDept ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Complaint Details Modal */}
      {viewingIssue && (
        <div className="modal-overlay" onClick={() => setViewingIssue(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 className="modal-title" style={{ margin: 0 }}>
                  📋 Complaint Details
                </h2>
                <span className={`pro-status-badge ${getStatusClass(viewingIssue.status)}`}>
                  <span className="status-dot"></span>
                  {viewingIssue.status || "Submitted"}
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setViewingIssue(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>COMPLAINT ID</span>
                  <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: "700" }}>
                    #{viewingIssue._id}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>CATEGORY</span>
                  <span className="category-pill" style={{ padding: "2px 8px", fontSize: "12px" }}>
                    {getCategoryIcon(viewingIssue.category)} {viewingIssue.category || "General"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>DEPARTMENT</span>
                  <span style={{ color: "#f1f5f9", fontWeight: "600", fontSize: "13px" }}>
                    🏢 {
                      departments.find((d) => d._id === (typeof viewingIssue.department === "object" && viewingIssue.department !== null ? viewingIssue.department._id : viewingIssue.department))?.name || "Unassigned"
                    }
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Title
                </label>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc" }}>
                  {viewingIssue.title}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Description
                </label>
                <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", background: "rgba(0,0,0,0.25)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {viewingIssue.description || "No description provided."}
                </div>
              </div>

              {(viewingIssue.latitude || viewingIssue.longitude) && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Location
                  </label>
                  <a
                    className="meta-chip location-link"
                    style={{ display: "inline-flex", width: "fit-content" }}
                    href={`https://www.google.com/maps?q=${viewingIssue.latitude},${viewingIssue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 Coordinates: {viewingIssue.latitude}, {viewingIssue.longitude} ↗ (Open in Google Maps)
                  </a>
                </div>
              )}

              {(viewingIssue.photo || viewingIssue.resolvedPhoto) && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Photo Proofs
                  </label>
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {viewingIssue.photo && (
                      <div
                        style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", overflow: "hidden", width: "160px" }}
                        onClick={() =>
                          setLightboxImage({
                            url: getPhotoUrl(viewingIssue.photo),
                            title: viewingIssue.title,
                            type: "Citizen Photo Proof",
                          })
                        }
                      >
                        <img
                          src={getPhotoUrl(viewingIssue.photo)}
                          alt="Citizen Proof"
                          style={{ width: "100%", height: "110px", objectFit: "cover" }}
                        />
                        <div style={{ padding: "4px 8px", fontSize: "11px", color: "#38bdf8", textAlign: "center", background: "rgba(15,23,42,0.9)" }}>
                          📷 Citizen Proof (Zoom)
                        </div>
                      </div>
                    )}
                    {viewingIssue.resolvedPhoto && (
                      <div
                        style={{ cursor: "pointer", border: "1px solid #10b981", borderRadius: "8px", overflow: "hidden", width: "160px" }}
                        onClick={() =>
                          setLightboxImage({
                            url: getPhotoUrl(viewingIssue.resolvedPhoto),
                            title: viewingIssue.title,
                            type: "Completed Work Proof",
                          })
                        }
                      >
                        <img
                          src={getPhotoUrl(viewingIssue.resolvedPhoto)}
                          alt="Resolved Proof"
                          style={{ width: "100%", height: "110px", objectFit: "cover" }}
                        />
                        <div style={{ padding: "4px 8px", fontSize: "11px", color: "#10b981", textAlign: "center", background: "rgba(15,23,42,0.9)" }}>
                          ✅ Resolved Proof (Zoom)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Citizen Rating & Feedback */}
              {viewingIssue.feedback?.rating && (
                <div style={{ background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#facc15", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ⭐ Citizen Resolution Feedback
                    </span>
                    <span style={{ color: "#facc15", fontWeight: "700", fontSize: "14px" }}>
                      {"★".repeat(viewingIssue.feedback.rating)}{"☆".repeat(5 - viewingIssue.feedback.rating)} ({viewingIssue.feedback.rating}/5)
                    </span>
                  </div>
                  {viewingIssue.feedback.comment && (
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#e2e8f0", fontStyle: "italic" }}>
                      "{viewingIssue.feedback.comment}"
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Reported: {viewingIssue.createdAt ? new Date(viewingIssue.createdAt).toLocaleString() : "Recently"}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      const itemToEdit = viewingIssue;
                      setViewingIssue(null);
                      handleOpenEditModal(itemToEdit);
                    }}
                  >
                    ✏️ Edit Complaint
                  </button>
                  <button
                    type="button"
                    className="btn-modal-submit"
                    onClick={() => setViewingIssue(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {editingIssue && (
        <div className="modal-overlay" onClick={() => setEditingIssue(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Complaint #{editingIssue._id?.slice(-6)}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditingIssue(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="modal-form-group">
                <label>Complaint Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, category: e.target.value })
                  }
                >
                  <option value="Roads & Footpaths">🚧 Roads & Footpaths</option>
                  <option value="Street Lighting">💡 Street Lighting</option>
                  <option value="Garbage & Sanitation">🗑️ Garbage & Sanitation</option>
                  <option value="Water Supply">🚰 Water Supply</option>
                  <option value="Drainage & Sewage">🌊 Drainage & Sewage</option>
                  <option value="Public Safety">🚨 Public Safety</option>
                  <option value="General">📍 General</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Current Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                >
                  <option value="Submitted">📥 Submitted</option>
                  <option value="Verified">🔍 Verified</option>
                  <option value="Assigned">🏢 Assigned</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Resolved">✅ Resolved</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Assigned Department</label>
                <select
                  value={editFormData.department}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, department: e.target.value })
                  }
                >
                  <option value="">⚠️ Unassigned (None)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  style={{
                    background: "#0d1117",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditingIssue(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          LEFT SIDEBAR NAVIGATION
          ========================================================= */}
      <aside
        className={`dept-sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Brand Header */}
        <div className="dept-sidebar-brand">
          <Link to="/" className="sidebar-logo">
            <span className="sidebar-logo-icon">🏛️</span>
            {!isCollapsed && (
              <div className="sidebar-logo-text-group">
                <span className="sidebar-logo-text">FixMyCity</span>
                <span className="sidebar-logo-sub" style={{ color: "#38bdf8" }}>
                  Admin HQ
                </span>
              </div>
            )}
          </Link>
          <button
            className="sidebar-collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "»" : "«"}
          </button>
        </div>

        {/* Administrator Profile Badge */}
        <div className="dept-officer-profile">
          <div
            className="officer-avatar"
            style={{
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.05))",
              borderColor: "rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
            }}
            title={currentUser?.name || "City Administrator"}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
            <span className="officer-online-dot" title="Active On Duty" />
          </div>
          {!isCollapsed && (
            <div className="officer-info">
              <span className="officer-name">
                {currentUser?.name || "City Administrator"}
              </span>
              <span className="officer-role-tag" style={{ color: "#38bdf8" }}>
                🛡️ Master Admin
              </span>
              <span className="officer-email">
                {currentUser?.email || "admin@gmail.com"}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="dept-sidebar-scroll">
          {/* SECTION 1: ADMIN OPERATIONS SWITCHER */}
          <div className="dept-nav-group">
            {!isCollapsed && (
              <div className="dept-nav-group-title">ADMIN MODULES</div>
            )}

            <button
              className={`dept-nav-item ${activeTab === "complaints" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("complaints");
                setDepartmentFilter("All");
                setStatusFilter("All");
                setSearchQuery("");
                setIsMobileOpen(false);
              }}
              title="Complaints - View All Complaints"
            >
              <span className="nav-item-icon">📋</span>
              {!isCollapsed && (
                <span className="nav-item-label">Complaints</span>
              )}
              {!isCollapsed && (
                <span className="nav-item-badge">{issues.length}</span>
              )}
            </button>

            <button
              className={`dept-nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("users");
                setUserSearchQuery("");
                setIsMobileOpen(false);
              }}
              title="Users - View All Users"
            >
              <span className="nav-item-icon">👥</span>
              {!isCollapsed && (
                <span className="nav-item-label">Users</span>
              )}
              {!isCollapsed && (
                <span
                  className="nav-item-badge"
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  {userStats.total}
                </span>
              )}
            </button>

            <button
              className={`dept-nav-item ${activeTab === "departments" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("departments");
                setDeptSearchQuery("");
                setDepartmentsPage(1);
                setIsMobileOpen(false);
              }}
              title="Departments - Manage Departments"
            >
              <span className="nav-item-icon">🏢</span>
              {!isCollapsed && (
                <span className="nav-item-label">Departments</span>
              )}
              {!isCollapsed && (
                <span
                  className="nav-item-badge"
                  style={{
                    background: "rgba(168, 85, 247, 0.15)",
                    color: "#c084fc",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                  }}
                >
                  {departments.length}
                </span>
              )}
            </button>

            <button
              className={`dept-nav-item ${activeTab === "feedbacks" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("feedbacks");
                setFeedbackSearchQuery("");
                setFeedbackRatingFilter("All");
                setFeedbackPage(1);
                setIsMobileOpen(false);
              }}
              title="Reviews - Citizen Reviews"
            >
              <span className="nav-item-icon">⭐</span>
              {!isCollapsed && (
                <span className="nav-item-label">Reviews</span>
              )}
              {!isCollapsed && (
                <span
                  className="nav-item-badge"
                  style={{
                    background: "rgba(250, 204, 21, 0.15)",
                    color: "#facc15",
                    border: "1px solid rgba(250, 204, 21, 0.3)",
                  }}
                >
                  {feedbacks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="dept-sidebar-footer">
          <Link
            to="/"
            className="sidebar-action-btn"
            title="Return to Public Portal Home"
          >
            <span>🏠</span>
            {!isCollapsed && <span>Public Portal</span>}
          </Link>
          <button
            className="sidebar-action-btn logout"
            onClick={handleLogout}
            title="Sign out"
          >
            <span>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          RIGHT MAIN CONTENT AREA
          ========================================================= */}
      <main className="dept-main-content">
        {/* =========================================================
            HEADER BAR
            ========================================================= */}
        <header className="dept-topbar">
          <div className="dept-topbar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              title="Open Navigation"
            >
              ☰
            </button>
            <div className="dept-header-title-wrap">
              <h1 className="dept-page-heading">
                {activeTab === "complaints" ? (
                  departmentFilter === "Unassigned" ? (
                    <>
                      <span>Unassigned Complaints</span>
                    </>
                  ) : currentDept ? (
                    <>
                      <span>{currentDept.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="accent-text">Complaints</span>
                    </>
                  )
                ) : activeTab === "users" ? (
                  <>
                    <span className="accent-text">Users</span>
                  </>
                ) : activeTab === "departments" ? (
                  <>
                    <span className="accent-text">Departments</span>
                  </>
                ) : (
                  <>
                    <span className="accent-text">Reviews</span>
                  </>
                )}
              </h1>
              <p className="dept-page-subheading">
                {activeTab === "complaints"
                  ? departmentFilter === "Unassigned"
                    ? `Complaints pending municipal department assignment • ${complaintStats.total} complaints`
                    : currentDept
                    ? `Managing complaints assigned to ${currentDept.name} • ${complaintStats.total} complaints`
                    : `Central civic grievance repository`
                  : activeTab === "users"
                  ? `Platform user directory `
                  : activeTab === "departments"
                  ? `Municipal department directory`
                  : `Citizen satisfaction reviews, service ratings & portal feedback`}
              </p>
            </div>
          </div>

          <div className="dept-topbar-right">
            {/* Search Input */}
            <div className="dept-topbar-search">
              <span className="topbar-search-icon">🔍</span>
              <input
                type="text"
                placeholder={
                  activeTab === "complaints"
                    ? "Search complaints, ID, category..."
                    : activeTab === "users"
                    ? "Search users by name, email, role..."
                    : activeTab === "departments"
                    ? "Search departments by name or scope..."
                    : "Search feedbacks by citizen, comment, topic..."
                }
                value={
                  activeTab === "complaints"
                    ? searchQuery
                    : activeTab === "users"
                    ? userSearchQuery
                    : activeTab === "departments"
                    ? deptSearchQuery
                    : feedbackSearchQuery
                }
                onChange={(e) => {
                  if (activeTab === "complaints") setSearchQuery(e.target.value);
                  else if (activeTab === "users") setUserSearchQuery(e.target.value);
                  else if (activeTab === "departments") setDeptSearchQuery(e.target.value);
                  else setFeedbackSearchQuery(e.target.value);
                }}
              />
              {(activeTab === "complaints"
                ? searchQuery
                : activeTab === "users"
                ? userSearchQuery
                : activeTab === "departments"
                ? deptSearchQuery
                : feedbackSearchQuery) && (
                <button
                  className="clear-search-btn"
                  onClick={() => {
                    if (activeTab === "complaints") setSearchQuery("");
                    else if (activeTab === "users") setUserSearchQuery("");
                    else if (activeTab === "departments") setDeptSearchQuery("");
                    else setFeedbackSearchQuery("");
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="dept-content-body">
          {/* =========================================================
              VIEW CONTENT: COMPLAINTS OPERATIONS TAB
              ========================================================= */}
          {activeTab === "complaints" && (
            <>
              {/* Interactive Metric Cards Strip */}
              <div className="stats-grid">
                <div
                  className={`stat-card ${statusFilter === "All" ? "stat-active" : ""}`}
                  onClick={() => setStatusFilter("All")}
                  title="Click to view all complaints"
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-value">{complaintStats.total}</span>
                    <span className="stat-label">Total Complaints</span>
                  </div>
                </div>

                <div
                  className={`stat-card stat-card-submitted ${
                    statusFilter === "Submitted" ? "stat-active" : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(statusFilter === "Submitted" ? "All" : "Submitted")
                  }
                  title="Click to filter new submitted complaints"
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon">📥</div>
                  <div className="stat-info">
                    <span className="stat-value">{complaintStats.submitted}</span>
                    <span className="stat-label">New Submitted</span>
                  </div>
                </div>

                <div
                  className={`stat-card stat-card-verified ${
                    statusFilter === "Verified" ? "stat-active" : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(statusFilter === "Verified" ? "All" : "Verified")
                  }
                  title="Click to filter verified complaints"
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon">🔍</div>
                  <div className="stat-info">
                    <span className="stat-value">{complaintStats.verified}</span>
                    <span className="stat-label">Verified</span>
                  </div>
                </div>

                <div
                  className={`stat-card stat-card-progress ${
                    statusFilter === "In Progress" ? "stat-active" : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "In Progress" ? "All" : "In Progress"
                    )
                  }
                  title="Click to filter in progress complaints"
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon">⚙️</div>
                  <div className="stat-info">
                    <span className="stat-value">{complaintStats.inProgress}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                </div>

                <div
                  className={`stat-card stat-card-resolved ${
                    statusFilter === "Resolved" ? "stat-active" : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(statusFilter === "Resolved" ? "All" : "Resolved")
                  }
                  title="Click to filter resolved complaints"
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{complaintStats.resolved}</span>
                    <span className="stat-label">Resolved</span>
                  </div>
                </div>
              </div>

              {/* Complaints Center Filter & Controls Toolbar */}
              <div className="complaints-center-toolbar">
                <div className="toolbar-left-controls">
                  <div className="toolbar-control-group">
                    <label className="toolbar-control-label" htmlFor="dept-select-filter">
                      <span className="toolbar-icon">🏢</span> Department:
                    </label>
                    <select
                      id="dept-select-filter"
                      className="toolbar-select toolbar-select-dept"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      title="Filter complaints by department or unassigned"
                    >
                      <option value="All">🌐 All Departments ({issues.length})</option>
                      <option value="Unassigned">
                        ⚠️ Unassigned Complaints ({deptIssueCounts.unassigned || 0})
                      </option>
                      <optgroup label="Municipal Departments">
                        {departments.map((dept) => {
                          const count = deptIssueCounts[String(dept._id)] || 0;
                          return (
                            <option key={dept._id} value={String(dept._id)}>
                              {getDeptIcon(dept.name)} {dept.name} ({count})
                            </option>
                          );
                        })}
                      </optgroup>
                    </select>
                  </div>

                  <div className="toolbar-control-group">
                    <label className="toolbar-control-label" htmlFor="status-select-filter">
                      <span className="toolbar-icon">⚡</span> Status:
                    </label>
                    <select
                      id="status-select-filter"
                      className="toolbar-select toolbar-select-status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      title="Filter complaints by workflow status"
                    >
                      <option value="All">📊 All Statuses ({issues.length})</option>
                      <option value="Submitted">📥 Submitted ({complaintStats.submitted})</option>
                      <option value="Verified">🔍 Verified ({complaintStats.verified})</option>
                      <option value="In Progress">⚙️ In Progress ({complaintStats.inProgress})</option>
                      <option value="Resolved">✅ Resolved ({complaintStats.resolved})</option>
                      <option value="Rejected">❌ Rejected ({complaintStats.rejected})</option>
                    </select>
                  </div>
                </div>

                <div className="toolbar-right-meta">
                  {/* Table / Cards View Mode Toggle */}
                  <div className="view-mode-toggle">
                    <button
                      className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                      onClick={() => setViewMode("table")}
                      title="Professional Table View"
                    >
                      📋
                    </button>
                    <button
                      className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                      onClick={() => setViewMode("cards")}
                      title="Executive Card Grid"
                    >
                      🗂️ 
                    </button>
                  </div>

                  {(departmentFilter !== "All" || statusFilter !== "All" || searchQuery) && (
                    <button
                      className="btn-toolbar-reset"
                      onClick={() => {
                        setDepartmentFilter("All");
                        setStatusFilter("All");
                        setSearchQuery("");
                      }}
                      title="Reset all filters to show all complaints"
                    >
                      ✕ Reset to All
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading civic complaints from database...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredIssues.length === 0 && (
                <div className="dashboard-empty">
                  <div className="empty-icon">📂</div>
                  <h3>No Complaints Found</h3>
                  <p>
                    {issues.length === 0
                      ? "No civic complaints have been reported yet."
                      : "No complaints found matching the current search or filters."}
                  </p>
                  {(searchQuery || statusFilter !== "All" || departmentFilter !== "All") && (
                    <button
                      className="btn-reset-filters"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("All");
                        setDepartmentFilter("All");
                      }}
                    >
                      Show All Complaints
                    </button>
                  )}
                </div>
              )}

              {/* Table View */}
              {!loading && filteredIssues.length > 0 && viewMode === "table" && (
                <div className="pro-table-wrapper">
                  <div className="pro-table-scroll">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th className="col-id">Complaint ID</th>
                          <th className="col-info">Title</th>
                          <th className="col-dept">Department</th>
                          <th className="col-date">Reported Date</th>
                          <th className="col-status">Current Status</th>
                          <th className="col-action" style={{ textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedIssues.map((issue) => {
                          const assignedDept = departments.find(
                            (d) =>
                              d._id ===
                              (typeof issue.department === "object" && issue.department !== null
                                ? issue.department._id
                                : issue.department)
                          );

                          return (
                            <tr
                              key={issue._id}
                              className={updatingId === issue._id ? "row-updating" : ""}
                            >
                              <td>
                                <span
                                  className="td-id-chip"
                                  title="Click to copy ID"
                                  onClick={() => {
                                    navigator.clipboard.writeText(issue._id);
                                    showToast("Complaint ID copied!");
                                  }}
                                >
                                  📋 #{issue._id ? issue._id.slice(-6) : "ID"}
                                </span>
                              </td>

                              <td>
                                <span className="td-issue-title" title={issue.title} style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>
                                  {issue.title}
                                </span>
                              </td>

                              <td>
                                <span className={`dept-badge ${assignedDept ? "assigned" : "unassigned"}`}>
                                  {assignedDept ? assignedDept.name : "Not Assigned"}
                                </span>
                              </td>

                              <td>
                                <span className="td-meta-date">
                                  {issue.createdAt
                                    ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recent"}
                                </span>
                              </td>

                              <td>
                                <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                                  <span className="status-dot"></span>
                                  {issue.status || "Submitted"}
                                </span>
                              </td>

                              <td className="col-action" style={{ textAlign: "center" }}>
                                <div className="table-action-icons" style={{ justifyContent: "center" }}>
                                  <button
                                    className="action-icon-btn view"
                                    onClick={() => setViewingIssue(issue)}
                                    title="View Complaint Details"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="action-icon-btn edit"
                                    onClick={() => handleOpenEditModal(issue)}
                                    title="Edit Complaint"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => handleDeleteIssue(issue._id, issue.title)}
                                    title="Delete Complaint"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cards View */}
              {!loading && filteredIssues.length > 0 && viewMode === "cards" && (
                <div className="dashboard-cards-grid">
                  {paginatedIssues.map((issue) => {
                    const assignedDept = departments.find(
                      (d) =>
                        d._id ===
                        (typeof issue.department === "object" && issue.department !== null
                          ? issue.department._id
                          : issue.department)
                    );

                    return (
                      <div
                        className={`dashboard-card ${updatingId === issue._id ? "card-updating" : ""}`}
                        key={issue._id}
                      >
                        <div className="card-top-bar">
                          <span className="category-pill">
                            <span className="cat-icon">
                              {getCategoryIcon(issue.category)}
                            </span>
                            {issue.category || "General"}
                          </span>

                          <div className="card-top-right-group">
                            <span className={`pro-status-badge ${getStatusClass(issue.status)}`}>
                              <span className="status-dot"></span>
                              {issue.status || "Submitted"}
                            </span>
                            <span
                              className="id-chip"
                              title="Click to copy ID"
                              onClick={() => {
                                navigator.clipboard.writeText(issue._id);
                                showToast("Complaint ID copied!");
                              }}
                            >
                              #{issue._id ? issue._id.slice(-6) : "ID"}
                            </span>
                          </div>
                        </div>

                        <div className="card-content-area" style={{ margin: "4px 0" }}>
                          <h2 className="card-title" style={{ fontSize: "16px", marginBottom: "6px" }}>
                            {issue.title}
                          </h2>
                          <p className="card-description" style={{ fontSize: "13px" }}>
                            {issue.description}
                          </p>
                        </div>

                        <div className="card-meta-chips-row">
                          <span className="meta-chip">
                            📅 {issue.createdAt
                              ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </span>

                          {(issue.latitude || issue.longitude) && (
                            <a
                              className="meta-chip location-link"
                              href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open GPS coordinates"
                            >
                              📍 {Number(issue.latitude).toFixed(3)}, {Number(issue.longitude).toFixed(3)} ↗
                            </a>
                          )}

                          <span className={`meta-chip ${assignedDept ? "assigned" : "unassigned"}`}>
                            🏢 {assignedDept ? assignedDept.name : "Not Assigned"}
                          </span>
                        </div>

                        {(issue.photo || issue.resolvedPhoto) && (
                          <div className="card-photos-strip">
                            {issue.photo && (
                              <div
                                className="photo-strip-item"
                                title="Click to view full image"
                                onClick={() =>
                                  setLightboxImage({
                                    url: getPhotoUrl(issue.photo),
                                    title: issue.title,
                                    type: "Citizen Photo",
                                  })
                                }
                              >
                                <img
                                  src={getPhotoUrl(issue.photo)}
                                  alt="Citizen reported issue"
                                />
                                <span className="photo-strip-tag">📷 Citizen Proof</span>
                                <span className="photo-strip-zoom-hint">🔍 Expand</span>
                              </div>
                            )}

                            {issue.resolvedPhoto && (
                              <div
                                className="photo-strip-item"
                                title="Click to view full image"
                                onClick={() =>
                                  setLightboxImage({
                                    url: getPhotoUrl(issue.resolvedPhoto),
                                    title: issue.title,
                                    type: "Completed Work Proof",
                                  })
                                }
                                style={{ borderColor: "#10b981" }}
                              >
                                <img
                                  src={getPhotoUrl(issue.resolvedPhoto)}
                                  alt="Completed work proof"
                                />
                                <span className="photo-strip-tag resolved">✅ Resolved Proof</span>
                                <span className="photo-strip-zoom-hint">🔍 Expand</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="card-controls-footer" style={{ paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Actions:</span>
                          <div className="table-action-icons">
                            <button
                              className="action-icon-btn view"
                              onClick={() => setViewingIssue(issue)}
                              title="View Complaint Details"
                            >
                              👁️
                            </button>
                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenEditModal(issue)}
                              title="Edit Complaint"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-icon-btn delete"
                              onClick={() => handleDeleteIssue(issue._id, issue.title)}
                              title="Delete Complaint"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Complaints Pagination Bar */}
              {!loading && filteredIssues.length > 0 && (
                <Pagination
                  currentPage={complaintsPage}
                  totalPages={totalComplaintsPages}
                  totalItems={filteredIssues.length}
                  pageSize={complaintsPageSize}
                  onPageChange={setComplaintsPage}
                  onPageSizeChange={setComplaintsPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              )}
            </>
          )}

          {/* =========================================================
              VIEW CONTENT: MANAGE USERS TAB
              ========================================================= */}
          {activeTab === "users" && (
            <>
              {/* User Metric Cards Strip */}
              <div className="stats-grid">
                <div
                  className="stat-card"
                  title="Total registered platform citizens"
                >
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.total}</span>
                    <span className="stat-label">Total Citizens</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  title="Active platform citizens"
                >
                  <div className="stat-icon">👤</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: "#4ade80" }}>{userStats.active}</span>
                    <span className="stat-label">Active Citizens</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  title="Blocked citizens"
                >
                  <div className="stat-icon">🚫</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: userStats.blocked > 0 ? "#f87171" : "inherit" }}>
                      {userStats.blocked}
                    </span>
                    <span className="stat-label">Blocked Citizens</span>
                  </div>
                </div>
              </div>

              {/* Users Toolbar - Top of Table */}
              <div className="complaints-center-toolbar" style={{ marginTop: "10px" }}>
                <div className="toolbar-left-controls">
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Displaying <strong>{filteredUsers.length}</strong> platform citizens
                  </span>
                </div>

                <div className="toolbar-right-meta">
                  <div className="view-mode-toggle">
                    <button
                      className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                      onClick={() => setViewMode("table")}
                      title="Professional Table View"
                    >
                      📋 
                    </button>
                    <button
                      className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                      onClick={() => setViewMode("cards")}
                      title="Executive Card Grid"
                    >
                      🗂️ 
                    </button>
                  </div>

                  {userSearchQuery && (
                    <button
                      className="btn-toolbar-reset"
                      onClick={() => setUserSearchQuery("")}
                      title="Clear search query"
                    >
                      ✕ Clear Search
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loadingUsers && (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading platform users...</p>
                </div>
              )}

              {/* Empty State */}
              {!loadingUsers && filteredUsers.length === 0 && (
                <div className="dashboard-empty">
                  <div className="empty-icon">👥</div>
                  <h3>No Citizens Found</h3>
                  <p>No citizen accounts matched the current search.</p>
                  {userSearchQuery && (
                    <button
                      className="btn-reset-filters"
                      onClick={() => setUserSearchQuery("")}
                    >
                      Show All Citizens
                    </button>
                  )}
                </div>
              )}

              {/* =========================================================
                  USERS: PROFESSIONAL DATA TABLE
                  ========================================================= */}
              {!loadingUsers && filteredUsers.length > 0 && viewMode === "table" && (
                <div className="pro-table-wrapper">
                  <div className="pro-table-scroll">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Created At</th>
                          <th style={{ textAlign: "center" }}>Block Status</th>
                          <th style={{ width: "130px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((u) => {
                          return (
                            <tr key={u._id}>
                              {/* Name */}
                              <td>
                                <div className="user-cell-wrap">
                                  <div className={`user-avatar-circle ${u.isBlocked ? "role-blocked" : "role-user"}`}>
                                    {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <span className="user-fullname">{u.name || "Unnamed"}</span>
                                </div>
                              </td>

                              {/* Email */}
                              <td>
                                <span className="user-email-text" style={{ color: "#38bdf8", fontSize: "13.5px" }}>
                                  {u.email}
                                </span>
                              </td>

                              {/* Created At */}
                              <td>
                                <span className="td-meta-date">
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </span>
                              </td>

                              {/* Block Status */}
                              <td style={{ textAlign: "center" }}>
                                <span
                                  className={`status-pill ${u.isBlocked ? "status-blocked" : "status-active"}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "3px 10px",
                                    borderRadius: "999px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    background: u.isBlocked ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                                    color: u.isBlocked ? "#f87171" : "#4ade80",
                                    border: `1px solid ${u.isBlocked ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                                  }}
                                >
                                  {u.isBlocked ? "🔴 Blocked" : "🟢 Active"}
                                </span>
                              </td>

                              {/* Actions (View, Block/Unblock, Delete) */}
                              <td style={{ textAlign: "center" }}>
                                <div className="table-action-icons" style={{ justifyContent: "center", gap: "6px" }}>
                                  <button
                                    className="action-icon-btn view"
                                    onClick={() => setViewingUser(u)}
                                    title="View User Details"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="action-icon-btn"
                                    onClick={() => handleToggleBlockUser(u)}
                                    title={u.isBlocked ? "Unblock Citizen" : "Block Citizen"}
                                    style={{
                                      background: u.isBlocked ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                      color: u.isBlocked ? "#4ade80" : "#f87171",
                                      borderColor: u.isBlocked ? "rgba(34, 197, 94, 0.35)" : "rgba(239, 68, 68, 0.35)",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {u.isBlocked ? "🔓" : "🚫"}
                                  </button>
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    title="Delete User"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =========================================================
                  USERS: CARDS VIEW
                  ========================================================= */}
              {!loadingUsers && filteredUsers.length > 0 && viewMode === "cards" && (
                <div className="dashboard-cards-grid">
                  {paginatedUsers.map((u) => {
                    return (
                      <div className="user-card-pro" key={u._id}>
                        <div className="user-card-header">
                          <div className="user-cell-wrap">
                            <div className={`user-avatar-circle ${u.isBlocked ? "role-blocked" : "role-user"}`}>
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="user-info-text">
                              <span className="user-fullname">{u.name || "Unnamed"}</span>
                              <span className="user-email-text" style={{ color: "#38bdf8" }}>{u.email}</span>
                            </div>
                          </div>

                          <span
                            className={`status-pill ${u.isBlocked ? "status-blocked" : "status-active"}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: u.isBlocked ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                              color: u.isBlocked ? "#f87171" : "#4ade80",
                              border: `1px solid ${u.isBlocked ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                            }}
                          >
                            {u.isBlocked ? "🔴 Blocked" : "🟢 Active"}
                          </span>
                        </div>

                        <div className="card-content-area" style={{ margin: "10px 0" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            📅 Created At: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>

                        <div className="card-controls-footer" style={{ paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Actions:</span>
                          <div className="table-action-icons" style={{ gap: "6px" }}>
                            <button
                              className="action-icon-btn view"
                              onClick={() => setViewingUser(u)}
                              title="View User Details"
                            >
                              👁️
                            </button>
                            <button
                              className="action-icon-btn"
                              onClick={() => handleToggleBlockUser(u)}
                              title={u.isBlocked ? "Unblock Citizen" : "Block Citizen"}
                              style={{
                                background: u.isBlocked ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: u.isBlocked ? "#4ade80" : "#f87171",
                                borderColor: u.isBlocked ? "rgba(34, 197, 94, 0.35)" : "rgba(239, 68, 68, 0.35)",
                                fontSize: "12px",
                              }}
                            >
                              {u.isBlocked ? "🔓" : "🚫"}
                            </button>
                            <button
                              className="action-icon-btn delete"
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Users Pagination Bar */}
              {!loadingUsers && filteredUsers.length > 0 && (
                <Pagination
                  currentPage={usersPage}
                  totalPages={totalUsersPages}
                  totalItems={filteredUsers.length}
                  pageSize={usersPageSize}
                  onPageChange={setUsersPage}
                  onPageSizeChange={setUsersPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              )}
            </>
          )}

          {/* =========================================================
              VIEW CONTENT: MANAGE DEPARTMENTS TAB
              ========================================================= */}
          {activeTab === "departments" && (
            <>
              {/* Department Metric Cards Strip */}
              <div className="stats-grid">
                <div
                  className="stat-card"
                  title="Total registered municipal departments"
                >
                  <div className="stat-icon">🏢</div>
                  <div className="stat-info">
                    <span className="stat-value">{departments.length}</span>
                    <span className="stat-label">Total Departments</span>
                  </div>
                </div>

                <div
                  className="stat-card stat-card-verified"
                  title="Complaints currently assigned to departments"
                >
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {issues.filter((i) => i.department).length}
                    </span>
                    <span className="stat-label">Assigned Complaints</span>
                  </div>
                </div>

                <div
                  className="stat-card stat-card-progress"
                  title="Complaints awaiting department assignment"
                >
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {issues.filter((i) => !i.department).length}
                    </span>
                    <span className="stat-label">Unassigned Complaints</span>
                  </div>
                </div>
              </div>

              {/* Departments Toolbar - Top of Table */}
              <div className="complaints-center-toolbar" style={{ marginTop: "10px" }}>
                <div className="toolbar-left-controls">
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    🏛️ Showing {filteredDepartments.length} of {departments.length} Municipal Departments
                  </span>
                </div>

                <div className="toolbar-right-meta">
                  <div className="view-mode-toggle">
                    <button
                      className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                      onClick={() => setViewMode("table")}
                      title="Professional Table View"
                    >
                      📋 
                    </button>
                    <button
                      className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                      onClick={() => setViewMode("cards")}
                      title="Executive Card Grid"
                    >
                      🗂️ 
                    </button>
                  </div>

                  <button
                    className="btn-add-user"
                    onClick={() => setIsCreateDeptModalOpen(true)}
                    title="Create a new municipal department"
                  >
                    ➕ Add Department
                  </button>

                  {deptSearchQuery && (
                    <button
                      className="btn-toolbar-reset"
                      onClick={() => setDeptSearchQuery("")}
                      title="Reset search to show all departments"
                    >
                      ✕ Reset Search
                    </button>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {filteredDepartments.length === 0 && (
                <div className="dashboard-empty">
                  <div className="empty-icon">🏢</div>
                  <h3>No Departments Found</h3>
                  <p>No municipal departments matched your search query.</p>
                  {deptSearchQuery && (
                    <button
                      className="btn-reset-filters"
                      onClick={() => setDeptSearchQuery("")}
                    >
                      Show All Departments
                    </button>
                  )}
                </div>
              )}

              {/* =========================================================
                  DEPARTMENTS: PROFESSIONAL DATA TABLE
                  ========================================================= */}
              {filteredDepartments.length > 0 && viewMode === "table" && (
                <div className="pro-table-wrapper">
                  <div className="pro-table-scroll">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th>Department Name</th>
                          <th>Email</th>
                          <th style={{ width: "160px" }}>Created Date</th>
                          <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDepartments.map((dept) => {
                          const deptOfficer = users.find(
                            (u) =>
                              u.role === "department" &&
                              (typeof u.department === "object" && u.department !== null
                                ? u.department._id
                                : u.department) === dept._id
                          );

                          return (
                            <tr key={dept._id}>
                              <td>
                                <div className="dept-name-cell">
                                  <div className="dept-name-details">
                                    <span className="dept-title-text">
                                      {dept.name}
                                    </span>
                                    <div className="dept-meta-subrow">
                                      <span className="dept-code-pill">
                                        ID: {dept._id?.slice(-6)}
                                      </span>
                                      {deptOfficer?.password && (
                                        <span className="dept-email-pill" style={{ color: "#a3e635", borderColor: "rgba(163, 230, 53, 0.3)" }}>
                                          🔑 {deptOfficer.password}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span style={{ color: "#38bdf8", fontSize: "13.5px", fontWeight: 500 }}>
                                  {dept.email || "—"}
                                </span>
                              </td>

                              <td>
                                <span className="td-meta-date">
                                  {dept.createdAt
                                    ? new Date(dept.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "Active"}
                                </span>
                              </td>

                              <td style={{ textAlign: "center" }}>
                                <div className="table-action-icons" style={{ justifyContent: "center" }}>
                                  <button
                                    className="action-icon-btn view"
                                    onClick={() => setViewingDept(dept)}
                                    title="View Department Details"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="action-icon-btn edit"
                                    onClick={() => handleOpenEditDept(dept)}
                                    title="Edit Department"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => handleDeleteDept(dept._id, dept.name)}
                                    title="Delete Department"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =========================================================
                  DEPARTMENTS: CARDS VIEW
                  ========================================================= */}
              {filteredDepartments.length > 0 && viewMode === "cards" && (
                <div className="dashboard-cards-grid">
                  {paginatedDepartments.map((dept) => {
                    return (
                      <div className="dashboard-card" key={dept._id}>
                        <div className="card-top-bar">
                          <span className="category-pill" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.3)" }}>
                            {dept.name}
                          </span>
                          <span className="id-chip">#{dept._id ? dept._id.slice(-6) : "ID"}</span>
                        </div>

                        <div className="card-content-area" style={{ margin: "10px 0" }}>
                          {dept.email && (
                            <span style={{ fontSize: "11.5px", color: "#38bdf8", fontWeight: 600 }}>
                              ✉️ {dept.email}
                            </span>
                          )}
                        </div>

                        <div className="card-meta-chips-row">
                          <span className="meta-chip">
                            📅 {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "Active"}
                          </span>
                        </div>

                        <div className="card-controls-footer" style={{ paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Actions:</span>
                          <div className="table-action-icons">
                            <button
                              className="action-icon-btn view"
                              onClick={() => setViewingDept(dept)}
                              title="View Department Details"
                            >
                              👁️
                            </button>
                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenEditDept(dept)}
                              title="Edit Department"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-icon-btn delete"
                              onClick={() => handleDeleteDept(dept._id, dept.name)}
                              title="Delete Department"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Departments Pagination Bar */}
              {filteredDepartments.length > 0 && (
                <Pagination
                  currentPage={departmentsPage}
                  totalPages={totalDepartmentsPages}
                  totalItems={filteredDepartments.length}
                  pageSize={departmentsPageSize}
                  onPageChange={setDepartmentsPage}
                  onPageSizeChange={setDepartmentsPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              )}
            </>
          )}

          {/* =========================================================
              FEEDBACKS & REVIEWS TAB
              ========================================================= */}
          {activeTab === "feedbacks" && (
            <>
              {/* Feedback Metric Cards Strip */}
              <div className="stats-grid">
                <div
                  className={`stat-card ${feedbackRatingFilter === "All" ? "stat-active" : ""}`}
                  onClick={() => {
                    setFeedbackRatingFilter("All");
                    setFeedbackPage(1);
                  }}
                  style={{ cursor: "pointer" }}
                  title="Total Citizen Feedbacks"
                >
                  <div className="stat-icon">💬</div>
                  <div className="stat-info">
                    <span className="stat-value">{feedbackStats.total}</span>
                    <span className="stat-label">Total Feedbacks</span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ borderColor: "rgba(250, 204, 21, 0.35)" }}
                  title="Overall Average Rating out of 5.0"
                >
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: "#facc15" }}>
                      {feedbackStats.avgRating}{" "}
                      <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
                        / 5.0
                      </span>
                    </span>
                    <span className="stat-label">Average Rating</span>
                  </div>
                </div>

                <div
                  className="stat-card stat-card-verified"
                  title="Citizen Satisfaction Rate (4 & 5 Star Reviews)"
                >
                  <div className="stat-icon">🌟</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: "#10b981" }}>
                      {feedbackStats.satisfactionRate}%
                    </span>
                    <span className="stat-label">Satisfaction Rate</span>
                  </div>
                </div>

                <div
                  className={`stat-card ${feedbackRatingFilter === "5" ? "stat-active" : ""}`}
                  style={{ borderColor: "rgba(56, 189, 248, 0.35)", cursor: "pointer" }}
                  onClick={() => {
                    setFeedbackRatingFilter(feedbackRatingFilter === "5" ? "All" : "5");
                    setFeedbackPage(1);
                  }}
                  title="5-Star Ratings"
                >
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: "#38bdf8" }}>
                      {feedbackStats.count5}
                    </span>
                    <span className="stat-label">5-Star Reviews</span>
                  </div>
                </div>
              </div>

              {/* Feedbacks Toolbar */}
              <div className="complaints-center-toolbar" style={{ marginTop: "10px" }}>
                <div className="toolbar-left-controls">
                  <div className="toolbar-control-group">
                    <label className="toolbar-control-label" htmlFor="rating-select-filter">
                      <span className="toolbar-icon">⭐</span> Rating:
                    </label>
                    <select
                      id="rating-select-filter"
                      className="toolbar-select"
                      value={feedbackRatingFilter}
                      onChange={(e) => {
                        setFeedbackRatingFilter(e.target.value);
                        setFeedbackPage(1);
                      }}
                      title="Filter by star rating"
                    >
                      <option value="All">🌟 All Ratings ({feedbackStats.total})</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars ({feedbackStats.count5})</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars ({feedbackStats.count4})</option>
                      <option value="3">⭐⭐⭐ 3 Stars ({feedbackStats.count3})</option>
                      <option value="2">⭐⭐ 2 Stars ({feedbackStats.count2})</option>
                      <option value="1">⭐ 1 Star ({feedbackStats.count1})</option>
                    </select>
                  </div>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      marginLeft: "8px",
                    }}
                  >
                    Showing {filteredFeedbacks.length} of {feedbacks.length} Reviews
                  </span>
                </div>

                <div className="toolbar-right-meta">
                  <div className="view-mode-toggle">
                    <button
                      className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                      onClick={() => setViewMode("table")}
                      title="Professional Table View"
                    >
                      📋
                    </button>
                    <button
                      className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                      onClick={() => setViewMode("cards")}
                      title="Executive Card Grid"
                    >
                      🗂️
                    </button>
                  </div>

                  {(feedbackRatingFilter !== "All" || feedbackSearchQuery) && (
                    <button
                      className="btn-toolbar-reset"
                      onClick={() => {
                        setFeedbackRatingFilter("All");
                        setFeedbackSearchQuery("");
                        setFeedbackPage(1);
                      }}
                      title="Reset all filters"
                    >
                      ✕ Reset to All
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loadingFeedbacks && (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading citizen feedback and reviews...</p>
                </div>
              )}

              {/* Feedbacks Table View */}
              {!loadingFeedbacks && filteredFeedbacks.length > 0 && viewMode === "table" && (
                <div className="pro-table-wrapper">
                  <div className="pro-table-scroll">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th className="col-fb-user">Citizen</th>
                          <th className="col-fb-rating">Rating</th>
                          <th className="col-fb-topic">Category & Topic</th>
                          <th className="col-fb-comment">Review & Feedback</th>
                          <th className="col-fb-date">Submitted On</th>
                          <th className="col-fb-act" style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFeedbacks.map((fb) => {
                          const citizenName = fb.userName || fb.user?.name || "Citizen";
                          const citizenEmail = fb.user?.email || "No email";
                          const avatarLetter = citizenName.charAt(0).toUpperCase();

                          return (
                            <tr key={fb._id}>
                              <td>
                                <div className="user-cell-wrap">
                                  <div
                                    className="user-avatar-circle"
                                    style={{
                                      background: "linear-gradient(135deg, #facc15, #ca8a04)",
                                      color: "#000",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {avatarLetter}
                                  </div>
                                  <div className="user-info-text">
                                    <span className="user-fullname">{citizenName}</span>
                                    <span className="user-email-text">{citizenEmail}</span>
                                  </div>
                                </div>
                              </td>

                              <td>{renderStarRating(fb.rating)}</td>

                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                  <span className="fb-category-pill">{fb.category || "Resolution Quality"}</span>
                                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {fb.issueTitle || "General Portal / City Service"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="fb-comment-quote">
                                  "{fb.comment}"
                                </div>
                              </td>

                              <td>
                                <span className="td-meta-date">
                                  {fb.createdAt
                                    ? new Date(fb.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}
                                </span>
                              </td>

                              <td style={{ textAlign: "right", paddingRight: "20px" }}>
                                <button
                                  className="btn-delete-user"
                                  onClick={() => handleDeleteFeedback(fb._id, citizenName)}
                                  title="Delete feedback entry"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Feedbacks Cards View */}
              {!loadingFeedbacks && filteredFeedbacks.length > 0 && viewMode === "cards" && (
                <div className="dashboard-cards-grid">
                  {paginatedFeedbacks.map((fb) => {
                    const citizenName = fb.userName || fb.user?.name || "Citizen";
                    const citizenEmail = fb.user?.email || "No email";
                    const avatarLetter = citizenName.charAt(0).toUpperCase();

                    return (
                      <div className="fb-card-pro" key={fb._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                          <div className="user-cell-wrap">
                            <div
                              className="user-avatar-circle"
                              style={{
                                background: "linear-gradient(135deg, #facc15, #ca8a04)",
                                color: "#000",
                                fontWeight: 800,
                              }}
                            >
                              {avatarLetter}
                            </div>
                            <div className="user-info-text">
                              <span className="user-fullname">{citizenName}</span>
                              <span className="user-email-text">{citizenEmail}</span>
                            </div>
                          </div>
                          {renderStarRating(fb.rating)}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span className="fb-category-pill">{fb.category || "Resolution Quality"}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            • {fb.issueTitle || "General Portal / City Service"}
                          </span>
                        </div>

                        <div className="fb-comment-quote">
                          "{fb.comment}"
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: "12px",
                            marginTop: "4px",
                          }}
                        >
                          <span className="td-meta-date">
                            {fb.createdAt
                              ? new Date(fb.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </span>
                          <button
                            className="btn-delete-user"
                            onClick={() => handleDeleteFeedback(fb._id, citizenName)}
                            title="Delete feedback entry"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {!loadingFeedbacks && filteredFeedbacks.length === 0 && (
                <div className="no-issues-placeholder">
                  <div className="empty-state-icon">⭐</div>
                  <h3>No Citizen Feedback Found</h3>
                  <p>
                    {feedbackSearchQuery || feedbackRatingFilter !== "All"
                      ? "No reviews match your current filters. Try resetting the filter or search query."
                      : "No citizens have submitted feedback or reviews yet."}
                  </p>
                  {(feedbackSearchQuery || feedbackRatingFilter !== "All") && (
                    <button
                      className="btn-reset-filters"
                      onClick={() => {
                        setFeedbackSearchQuery("");
                        setFeedbackRatingFilter("All");
                        setFeedbackPage(1);
                      }}
                      style={{ marginTop: "12px" }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}

              {/* Feedbacks Pagination */}
              {filteredFeedbacks.length > 0 && (
                <Pagination
                  currentPage={feedbackPage}
                  totalPages={feedbackTotalPages}
                  totalItems={filteredFeedbacks.length}
                  pageSize={feedbackPageSize}
                  onPageChange={setFeedbackPage}
                  onPageSizeChange={setFeedbackPageSize}
                  pageSizeOptions={[6, 12, 24]}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
