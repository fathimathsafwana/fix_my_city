import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/useToast";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { API_BASE_URL } from "../config";
import { getAuthHeaders, getCurrentUser } from "../utils/auth";

// Modular Admin Components
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import ComplaintsTab from "../components/admin/ComplaintsTab";
import UsersTab from "../components/admin/UsersTab";
import DepartmentsTab from "../components/admin/DepartmentsTab";
import FeedbacksTab from "../components/admin/FeedbacksTab";

// Admin Modals
import LightboxModal from "../components/admin/modals/LightboxModal";
import ViewUserModal from "../components/admin/modals/ViewUserModal";
import ViewIssueModal from "../components/admin/modals/ViewIssueModal";
import EditIssueModal from "../components/admin/modals/EditIssueModal";
import {
  CreateDeptModal,
  ViewDeptModal,
  EditDeptModal,
} from "../components/admin/modals/DepartmentModals";

function AdminDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Primary Tab: 'complaints' | 'users' | 'departments' | 'feedbacks'
  const [activeTab, setActiveTab] = useState("complaints");

  // Reusable Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: "",
    itemName: "",
    itemType: "",
    message: "",
    confirmText: "Delete",
    isDeleting: false,
    onConfirm: null,
  });

  const closeDeleteModal = () => {
    setDeleteModal((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
  };

  // Complaints States
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // View, Edit & Inspect Issue Action States
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

  // Users States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [viewingUser, setViewingUser] = useState(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(5);

  // Feedbacks States
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(5);

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState("table");

  // Lightbox Modal for photo inspection
  const [lightboxImage, setLightboxImage] = useState(null);

  // Sidebar controls
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Current logged in user from localStorage
  const currentUser = useMemo(() => getCurrentUser(), []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    showToast("Signed out successfully.", "info");
    navigate("/login");
  };

  // Determine if any modal is currently open in Admin Dashboard
  const isAnyModalOpen = Boolean(
    lightboxImage ||
      viewingUser ||
      isCreateDeptModalOpen ||
      viewingDept ||
      editingDept ||
      viewingIssue ||
      editingIssue ||
      deleteModal.isOpen
  );

  // Prevent background scrolling and handle Escape key when any modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          if (lightboxImage) {
            setLightboxImage(null);
            return;
          }
          if (deleteModal.isOpen && !deleteModal.isDeleting) {
            closeDeleteModal();
            return;
          }
          setViewingUser(null);
          setIsCreateDeptModalOpen(false);
          setViewingDept(null);
          setEditingDept(null);
          setViewingIssue(null);
          setEditingIssue(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
  }, [
    isAnyModalOpen,
    lightboxImage,
    deleteModal.isOpen,
    deleteModal.isDeleting,
  ]);

  // Data Fetching Functions
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
      .then((response) => response.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoadingUsers(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
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

  // Department Creation & Editing Handlers
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
      showToast(
        "Please enter a valid email address with a domain (e.g. sanitation@fixmycity.com).",
        "error"
      );
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
      showToast(
        `Department "${data.department.name}" & login account created!`,
        "success"
      );
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
      const response = await fetch(
        `${API_BASE_URL}/api/departments/${editingDept._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(editDeptData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update department.");
      }

      setDepartments((prev) =>
        prev.map((d) => (d._id === editingDept._id ? data.department : d))
      );
      showToast(
        `Department "${data.department.name}" updated successfully!`,
        "success"
      );
      setEditingDept(null);
      fetchDepartments();
      fetchIssues();
    } catch (err) {
      showToast(err.message || "Failed to update department.", "error");
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = (id, name) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Department",
      itemName: name,
      itemType: "Department",
      message:
        "Are you sure you want to delete this department? Any issues or staff assigned to this department will become unassigned.",
      confirmText: "Delete Department",
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
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
          closeDeleteModal();
        } catch (err) {
          showToast(err.message || "Failed to delete department.", "error");
          setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Complaint Edit & Delete Handlers
  const handleOpenEditModal = (issue) => {
    if (issue.status === "Resolved") {
      showToast("Resolved complaints cannot be edited.", "warning");
      return;
    }
    const deptId =
      typeof issue.department === "object" && issue.department !== null
        ? issue.department._id || ""
        : issue.department || "";

    setEditingIssue(issue);
    setEditFormData({
      title: issue.title || "",
      category: issue.category || "General",
      description: issue.description || "",
      status:
        !issue.status || issue.status === "Submitted"
          ? "Pending"
          : issue.status,
      department: deptId,
    });
  };

  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingIssue) return;
    setSavingEdit(true);
    try {
      const updatePayload = {
        status: editFormData.status,
        department: editFormData.department,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/issues/${editingIssue._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(updatePayload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update complaint.");
      }

      setIssues((prev) =>
        prev.map((i) =>
          i._id === editingIssue._id
            ? data.issue || {
                ...i,
                status: editFormData.status,
                department:
                  departments.find((d) => d._id === editFormData.department) ||
                  editFormData.department,
              }
            : i
        )
      );
      showToast("Complaint updated successfully!", "success");
      setEditingIssue(null);
      fetchIssues();
    } catch (err) {
      showToast(err.message || "Failed to update complaint.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteIssue = (issueId, issueTitle) => {
    const target = issues.find((i) => i._id === issueId);
    if (target && target.status === "Resolved") {
      showToast("Resolved complaints cannot be deleted.", "warning");
      return;
    }

    setDeleteModal({
      isOpen: true,
      title: "Delete Complaint",
      itemName: issueTitle || `#${issueId}`,
      itemType: "Complaint",
      message:
        "Are you sure you want to delete this complaint? This action cannot be undone and will permanently remove this record from the system.",
      confirmText: "Delete Complaint",
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
          const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Failed to delete complaint.");
          }

          setIssues((prev) => prev.filter((i) => i._id !== issueId));
          showToast("Complaint deleted successfully!", "success");
          closeDeleteModal();
        } catch (err) {
          showToast(err.message || "Failed to delete complaint.", "error");
          setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // User Actions Handlers
  const handleToggleBlockUser = async (user) => {
    const nextStatus = !user.isBlocked;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${user._id}/block`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || `Failed to ${nextStatus ? "block" : "unblock"} user.`
        );
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
      showToast(err.message || "Failed to update citizen block status.", "error");
    }
  };

  const handleDeleteUser = (userId, userName) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete User Account",
      itemName: userName,
      itemType: "User",
      message:
        "Are you sure you want to delete this user? Their account will be permanently removed and this action cannot be undone.",
      confirmText: "Delete User",
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "Failed to delete user.");

          setUsers((prev) => prev.filter((u) => u._id !== userId));
          showToast(`User "${userName}" deleted successfully.`, "info");
          closeDeleteModal();
        } catch (err) {
          showToast(err.message || "Failed to delete user.", "error");
          setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Feedback Action Handlers
  const handleDeleteFeedback = (id, citizenName) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Feedback",
      itemName: citizenName ? `Feedback from ${citizenName}` : "Feedback entry",
      itemType: "Feedback",
      message:
        "Are you sure you want to delete this feedback? This action cannot be undone.",
      confirmText: "Delete Feedback",
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
          const response = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "Failed to delete feedback.");

          setFeedbacks((prev) => prev.filter((f) => f._id !== id));
          showToast("Feedback removed successfully.", "info");
          closeDeleteModal();
        } catch (err) {
          showToast(err.message || "Failed to delete feedback.", "error");
          setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Derived Computed Stats & Filters
  const currentDept = useMemo(() => {
    if (departmentFilter === "All" || departmentFilter === "Unassigned")
      return null;
    return departments.find((d) => String(d._id) === String(departmentFilter));
  }, [departments, departmentFilter]);

  const deptIssueCounts = useMemo(() => {
    const counts = { unassigned: 0 };
    issues.forEach((issue) => {
      const issueDeptId =
        typeof issue.department === "object" && issue.department !== null
          ? issue.department._id
          : issue.department;

      if (!issueDeptId) {
        counts.unassigned = (counts.unassigned || 0) + 1;
      } else {
        const key = String(issueDeptId);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        searchQuery === "" ||
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue._id?.toLowerCase().includes(searchQuery.toLowerCase());

      const normStatus =
        !issue.status || issue.status === "Submitted"
          ? "Pending"
          : issue.status;

      const matchesStatus =
        statusFilter === "All" ||
        normStatus.toLowerCase() === statusFilter.toLowerCase();

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
      pending: relevant.filter(
        (i) => !i.status || i.status === "Pending" || i.status === "Submitted"
      ).length,
      assigned: relevant.filter((i) => i.status === "Assigned").length,
      rejected: relevant.filter((i) => i.status === "Rejected").length,
    };
  }, [issues, departmentFilter]);

  // User Stats & Filtering (Citizens only)
  const userStats = useMemo(() => {
    const manageableUsers = users.filter(
      (u) => u.role !== "department" && u.role !== "admin"
    );
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
          u.email?.toLowerCase().includes(query) ||
          u._id?.toLowerCase().includes(query)
        );
      });
  }, [users, userSearchQuery]);

  // Filtered Departments
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

  // Feedback Statistics & Filtering
  const feedbackStats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        avgRating: "0.0",
        count5: 0,
        count4: 0,
        count3: 0,
        count2: 0,
        count1: 0,
        satisfactionRate: 0,
      };
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

    return {
      total,
      avgRating,
      count5,
      count4,
      count3,
      count2,
      count1,
      satisfactionRate,
    };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
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
  }, [feedbacks, feedbackSearchQuery]);

  // Pagination Reset Effects
  useEffect(() => {
    setComplaintsPage(1);
  }, [departmentFilter, statusFilter, searchQuery]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearchQuery]);

  useEffect(() => {
    setDepartmentsPage(1);
  }, [deptSearchQuery]);

  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearchQuery]);

  // Paginated Slices
  const totalComplaintsPages =
    Math.ceil(filteredIssues.length / complaintsPageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (complaintsPage - 1) * complaintsPageSize;
    return filteredIssues.slice(start, start + complaintsPageSize);
  }, [filteredIssues, complaintsPage, complaintsPageSize]);

  const totalUsersPages = Math.ceil(filteredUsers.length / usersPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * usersPageSize;
    return filteredUsers.slice(start, start + usersPageSize);
  }, [filteredUsers, usersPage, usersPageSize]);

  const totalDepartmentsPages =
    Math.ceil(filteredDepartments.length / departmentsPageSize) || 1;
  const paginatedDepartments = useMemo(() => {
    const start = (departmentsPage - 1) * departmentsPageSize;
    return filteredDepartments.slice(start, start + departmentsPageSize);
  }, [filteredDepartments, departmentsPage, departmentsPageSize]);

  const feedbackTotalPages =
    Math.ceil(filteredFeedbacks.length / feedbackPageSize) || 1;
  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (feedbackPage - 1) * feedbackPageSize;
    return filteredFeedbacks.slice(startIndex, startIndex + feedbackPageSize);
  }, [filteredFeedbacks, feedbackPage, feedbackPageSize]);

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
      <LightboxModal
        lightboxImage={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* View User Details Modal */}
      <ViewUserModal
        user={viewingUser}
        departments={departments}
        onClose={() => setViewingUser(null)}
        onToggleBlock={handleToggleBlockUser}
      />

      {/* Create Department Modal */}
      <CreateDeptModal
        isOpen={isCreateDeptModalOpen}
        newDeptData={newDeptData}
        setNewDeptData={setNewDeptData}
        creatingDept={creatingDept}
        showDeptPassword={showDeptPassword}
        setShowDeptPassword={setShowDeptPassword}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSubmit={handleCreateDepartment}
      />

      {/* View Department Details Modal */}
      <ViewDeptModal
        viewingDept={viewingDept}
        issues={issues}
        onClose={() => setViewingDept(null)}
        onEdit={(dept) => {
          setViewingDept(null);
          handleOpenEditDept(dept);
        }}
      />

      {/* Edit Department Modal */}
      <EditDeptModal
        editingDept={editingDept}
        editDeptData={editDeptData}
        setEditDeptData={setEditDeptData}
        savingDept={savingDept}
        showEditDeptPassword={showEditDeptPassword}
        setShowEditDeptPassword={setShowEditDeptPassword}
        onClose={() => setEditingDept(null)}
        onSubmit={handleSaveEditDept}
      />

      {/* View Complaint Details Modal */}
      <ViewIssueModal
        issue={viewingIssue}
        users={users}
        departments={departments}
        onClose={() => setViewingIssue(null)}
        onEdit={(item) => {
          setViewingIssue(null);
          handleOpenEditModal(item);
        }}
        onInspectPhoto={setLightboxImage}
      />

      {/* Edit Complaint Modal */}
      <EditIssueModal
        editingIssue={editingIssue}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        departments={departments}
        savingEdit={savingEdit}
        onClose={() => setEditingIssue(null)}
        onSubmit={handleSaveEdit}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        message={deleteModal.message}
        confirmText={deleteModal.confirmText}
        isDeleting={deleteModal.isDeleting}
        onConfirm={deleteModal.onConfirm}
        onClose={closeDeleteModal}
      />

      {/* Left Sidebar Navigation Component */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
        onTabChange={(tabKey) => {
          if (tabKey === "complaints") {
            setDepartmentFilter("All");
            setStatusFilter("All");
            setSearchQuery("");
          } else if (tabKey === "users") {
            setUserSearchQuery("");
          } else if (tabKey === "departments") {
            setDeptSearchQuery("");
            setDepartmentsPage(1);
          } else if (tabKey === "feedbacks") {
            setFeedbackSearchQuery("");
            setFeedbackPage(1);
          }
        }}
      />

      {/* Right Main Content Area */}
      <main className="dept-main-content">
        {/* Header Bar Component */}
        <AdminHeader
          activeTab={activeTab}
          departmentFilter={departmentFilter}
          currentDept={currentDept}
          complaintStats={complaintStats}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentUser={currentUser}
        />

        {/* Content Body */}
        <div className="dept-content-body">
          {activeTab === "complaints" && (
            <ComplaintsTab
              issues={issues}
              filteredIssues={filteredIssues}
              paginatedIssues={paginatedIssues}
              departments={departments}
              deptIssueCounts={deptIssueCounts}
              complaintStats={complaintStats}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              complaintsPage={complaintsPage}
              setComplaintsPage={setComplaintsPage}
              complaintsPageSize={complaintsPageSize}
              setComplaintsPageSize={setComplaintsPageSize}
              totalComplaintsPages={totalComplaintsPages}
              onViewIssue={setViewingIssue}
              onEditIssue={handleOpenEditModal}
              onDeleteIssue={handleDeleteIssue}
              onInspectPhoto={setLightboxImage}
              users={users}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={users}
              filteredUsers={filteredUsers}
              paginatedUsers={paginatedUsers}
              userStats={userStats}
              loadingUsers={loadingUsers}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              usersPage={usersPage}
              setUsersPage={setUsersPage}
              usersPageSize={usersPageSize}
              setUsersPageSize={setUsersPageSize}
              totalUsersPages={totalUsersPages}
              onViewUser={setViewingUser}
              onToggleBlockUser={handleToggleBlockUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === "departments" && (
            <DepartmentsTab
              departments={departments}
              filteredDepartments={filteredDepartments}
              paginatedDepartments={paginatedDepartments}
              deptSearchQuery={deptSearchQuery}
              setDeptSearchQuery={setDeptSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              departmentsPage={departmentsPage}
              setDepartmentsPage={setDepartmentsPage}
              departmentsPageSize={departmentsPageSize}
              setDepartmentsPageSize={setDepartmentsPageSize}
              totalDepartmentsPages={totalDepartmentsPages}
              issues={issues}
              onOpenCreateDept={() => setIsCreateDeptModalOpen(true)}
              onViewDept={setViewingDept}
              onEditDept={handleOpenEditDept}
              onDeleteDept={handleDeleteDept}
            />
          )}

          {activeTab === "feedbacks" && (
            <FeedbacksTab
              feedbacks={feedbacks}
              filteredFeedbacks={filteredFeedbacks}
              paginatedFeedbacks={paginatedFeedbacks}
              feedbackStats={feedbackStats}
              loadingFeedbacks={loadingFeedbacks}
              feedbackSearchQuery={feedbackSearchQuery}
              setFeedbackSearchQuery={setFeedbackSearchQuery}
              feedbackPage={feedbackPage}
              setFeedbackPage={setFeedbackPage}
              feedbackPageSize={feedbackPageSize}
              setFeedbackPageSize={setFeedbackPageSize}
              feedbackTotalPages={feedbackTotalPages}
              onDeleteFeedback={handleDeleteFeedback}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
