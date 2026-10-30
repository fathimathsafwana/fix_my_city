const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Issue = require("./models/Issue");
const Department = require("./models/Department");
const User = require("./models/User");
const Feedback = require("./models/Feedback");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper function to stream buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = "fixmycity") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const rawOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      process.env.FRONTEND_URL || "https://fix-my-city-seven.vercel.app",
      "https://fix-my-city-seven.vercel.app",
      "https://fix-my-city-bs3z.vercel.app",
      "http://localhost:5173",
    ];

const allowedOrigins = Array.from(
  new Set(rawOrigins.flatMap((o) => [o.replace(/\/$/, ""), `${o.replace(/\/$/, "")}/`]))
);

const app = express();

// Support Chrome Private Network Access (PNA) when https://*.vercel.app accesses local backend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });



const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

function validateStrongPassword(password) {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number (0-9)." };
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character (e.g. @, #, $, %, !, &, *)." };
  }
  return { isValid: true };
}

app.get("/", (req, res) => {
  res.send("Smart Civic Issue Reporting System Backend is running!");
});
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email address is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Validate strong password
    const passwordCheck = validateStrongPassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        message: passwordCheck.message,
      });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({
      email: { $regex: new RegExp("^" + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists. Please login instead.",
      });
    }

    const user = new User({
      name: cleanName,
      email: cleanEmail,
      password,
      role: "user",
    });

    const savedUser = await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: savedUser,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "An account with this email already exists. Please login instead.",
      });
    }

    res.status(500).json({
      message: error.message || "Failed to register user.",
      error: error.message,
    });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // Case-insensitive query
    let user = await User.findOne({
      email: { $regex: new RegExp("^" + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    });

    // Flexible fallback: if email has .com vs com typo
    if (!user) {
      if (cleanEmail.endsWith(".com")) {
        const withoutDot = cleanEmail.replace(/\.com$/, "com");
        user = await User.findOne({
          email: { $regex: new RegExp("^" + withoutDot.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
        });
      } else if (cleanEmail.endsWith("com") && !cleanEmail.endsWith(".com")) {
        const withDot = cleanEmail.replace(/com$/, ".com");
        user = await User.findOne({
          email: { $regex: new RegExp("^" + withDot.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.password !== cleanPassword && user.password !== password) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator. Please contact municipal support.",
      });
    }

    // Populate department object if department user
    let departmentData = user.department;
    if (user.role === "department" && user.department) {
      const deptObj = await Department.findById(user.department);
      if (deptObj) {
        departmentData = {
          _id: deptObj._id,
          name: deptObj.name,
          description: deptObj.description,
        };
      }
    }

    res.status(200).json({
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: departmentData,
        isBlocked: user.isBlocked || false,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);

    res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
});
app.post("/api/issues", upload.single("photo"), async (req, res) => {
  try {
    const { title, category, description, latitude, longitude, department } = req.body;
    const userId = req.headers["user-id"];

    let photoUrl = null;
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.buffer, "fixmycity/citizen_proofs");
    }

    let finalCategory = category && category.trim() ? category.trim() : "";
    const textToClassify = `${title || ""} ${description || ""} ${finalCategory}`.toLowerCase();

    let assignedDeptId = department && mongoose.Types.ObjectId.isValid(department) ? department : null;

    if (!assignedDeptId) {
      if (textToClassify.includes("garbage") || textToClassify.includes("waste") || textToClassify.includes("trash") || textToClassify.includes("dump") || textToClassify.includes("sanitat") || textToClassify.includes("hygiene")) {
        finalCategory = "Sanitation & Waste Management";
        const dept = await Department.findOne({ name: "Sanitation & Waste Management" });
        if (dept) assignedDeptId = dept._id;
      } else if (textToClassify.includes("pothole") || textToClassify.includes("road") || textToClassify.includes("tar") || textToClassify.includes("street") || textToClassify.includes("asphalt") || textToClassify.includes("footpath")) {
        finalCategory = "Roads & Infrastructure";
        const dept = await Department.findOne({ name: "Roads & Infrastructure" });
        if (dept) assignedDeptId = dept._id;
      } else if (textToClassify.includes("water") || textToClassify.includes("leak") || textToClassify.includes("pipe") || textToClassify.includes("drain") || textToClassify.includes("sewer") || textToClassify.includes("flood")) {
        finalCategory = "Water Supply & Drainage";
        const dept = await Department.findOne({ name: "Water Supply & Drainage" });
        if (dept) assignedDeptId = dept._id;
      } else {
        finalCategory = "Sanitation & Waste Management";
        const dept = await Department.findOne({ name: "Sanitation & Waste Management" });
        if (dept) assignedDeptId = dept._id;
      }
    } else {
      const dept = await Department.findById(assignedDeptId);
      if (dept && dept.name) {
        finalCategory = dept.name;
      }
    }

    const issueData = {
      title,
      category: finalCategory,
      description,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      photo: photoUrl,
      status: "Pending",
      department: assignedDeptId,
      user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    };

    const issue = new Issue(issueData);
    if (!issue.trackingId && issue._id) {
      issue.trackingId = issue._id.toString().slice(0, 10);
    }
    const savedIssue = await issue.save();

    console.log("New civic issue saved:", savedIssue);

    res.status(201).json({
      message: "Civic issue saved successfully!",
      issue: savedIssue,
      trackingId: savedIssue.trackingId || savedIssue._id.toString().slice(0, 10),
    });
  } catch (error) {
    console.error("Error saving issue:", error);

    res.status(500).json({
      message: "Failed to save civic issue.",
      error: error.message,
    });
  }
});

app.get("/api/issues", async (req, res) => {
  try {
    let query = {};
    if (req.query.department) {
      query.department = req.query.department;
    }

    const userId = req.headers["user-id"] || req.query.userId;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const requester = await User.findById(userId);
      if (requester) {
        if (requester.role === "user" || requester.role === "citizen") {
          // Regular citizens only see their own complaints
          query.user = requester._id;
        } else if (requester.role === "department" && requester.department && !query.department) {
          query.department = requester.department;
        }
      }
    } else if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      query.user = req.query.userId;
    }

    const issues = await Issue.find(query)
      .populate("user", "name email")
      .populate("department")
      .sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      message: "Failed to fetch issues.",
      error: error.message,
    });
  }
});

app.put("/api/issues/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const existing = await Issue.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (existing.status === "Resolved") {
      return res.status(400).json({
        message: "Resolved complaints are closed and cannot be modified.",
      });
    }

    if (status === "Resolved" && !existing.resolvedPhoto) {
      return res.status(400).json({
        message: "Proof image of completed work is required before marking complaint as Resolved.",
      });
    }

    existing.status = status;
    await existing.save();

    const populated = await Issue.findById(existing._id)
      .populate("user", "name email")
      .populate("department");

    res.status(200).json({
      message: "Complaint status updated successfully!",
      issue: populated,
    });
  } catch (error) {
    console.error("Error updating complaint status:", error);

    res.status(500).json({
      message: "Failed to update complaint status.",
      error: error.message,
    });
  }
});

// Update / Edit complaint details (Admin / Citizen)
app.put("/api/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, status, department, priority } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid complaint ID format." });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (issue.status === "Resolved") {
      return res.status(400).json({
        message: "Resolved complaints are closed and cannot be edited.",
      });
    }

    // Check if requester is an administrator
    const userId = req.headers["user-id"];
    let isAdmin = false;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const requester = await User.findById(userId);
      if (requester && requester.role === "admin") {
        isAdmin = true;
      }
    }

    // Block admin from modifying complaint title or description
    if (isAdmin) {
      const isTitleModified =
        title !== undefined &&
        typeof title === "string" &&
        title.trim() !== issue.title;
      const isDescriptionModified =
        description !== undefined &&
        typeof description === "string" &&
        description.trim() !== (issue.description || "").trim();

      if (isTitleModified || isDescriptionModified) {
        return res.status(403).json({
          message: "Administrators cannot edit citizen complaint title or description.",
        });
      }
    }

    const updateFields = {};
    if (!isAdmin) {
      if (issue.status === "Verified" || issue.status === "In Progress" || issue.status === "Assigned") {
        return res.status(400).json({
          message: "Verified complaints cannot be edited.",
        });
      }
      if (title !== undefined && typeof title === "string" && title.trim()) {
        updateFields.title = title.trim();
      }
      if (description !== undefined) updateFields.description = description;
    }
    if (category !== undefined) updateFields.category = category;
    if (status !== undefined) updateFields.status = status;
    if (department !== undefined) {
      const rawDept =
        typeof department === "object" && department !== null
          ? (department._id || department.id)
          : department;
      updateFields.department =
        rawDept && mongoose.Types.ObjectId.isValid(rawDept)
          ? rawDept.toString()
          : null;
      if (updateFields.department) {
        const d = await Department.findById(updateFields.department);
        if (d && d.name) {
          updateFields.category = d.name;
        }
      }
    }
    if (priority !== undefined) updateFields.priority = priority;

    const updated = await Issue.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: false }
    )
      .populate("user", "name email")
      .populate("department");

    res.status(200).json({
      message: "Complaint details updated successfully!",
      issue: updated,
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    res.status(500).json({
      message: "Failed to update complaint.",
      error: error.message,
    });
  }
});

// Delete complaint
app.delete("/api/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Issue.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (existing.status === "Resolved") {
      return res.status(400).json({
        message: "Resolved complaints cannot be deleted.",
      });
    }

    await Issue.findByIdAndDelete(id);
    res.status(200).json({
      message: "Complaint deleted successfully!",
      id,
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    res.status(500).json({
      message: "Failed to delete complaint.",
      error: error.message,
    });
  }
});

app.post("/api/departments", async (req, res) => {
  try {
    const { name, description, email, password } = req.body;

    if (!name || !name.trim() || !description || !description.trim()) {
      return res.status(400).json({
        message: "Department name and description are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // 1. Validate password first if email and password are provided
    if (cleanEmail && password) {
      const pwdCheck = validateStrongPassword(password.trim());
      if (!pwdCheck.isValid) {
        return res.status(400).json({
          message: "Department password error: " + pwdCheck.message,
        });
      }
    }

    // 2. Check if email already belongs to a citizen or admin
    let existingUser = null;
    if (cleanEmail) {
      existingUser = await User.findOne({
        email: { $regex: new RegExp("^" + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
      });
      if (existingUser && existingUser.role !== "department") {
        return res.status(400).json({
          message: `An account with email "${email}" already exists as a ${existingUser.role}. Please use another official email.`,
        });
      }
    }

    // 3. Check if a department with this name already exists (case-insensitive)
    const existingDept = await Department.findOne({
      name: { $regex: new RegExp("^" + cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    });

    let savedDepartment;
    if (existingDept) {
      existingDept.name = cleanName;
      existingDept.description = description.trim();
      if (cleanEmail) existingDept.email = cleanEmail;
      savedDepartment = await existingDept.save();
    } else {
      const department = new Department({
        name: cleanName,
        description: description.trim(),
        email: cleanEmail,
      });
      savedDepartment = await department.save();
    }

    // 4. Create or update official department officer login user
    if (cleanEmail && password) {
      if (existingUser) {
        existingUser.name = `${cleanName} Officer`;
        existingUser.role = "department";
        existingUser.password = password.trim();
        existingUser.department = savedDepartment._id;
        await existingUser.save();
      } else {
        const officerUser = new User({
          name: `${cleanName} Officer`,
          email: cleanEmail,
          password: password.trim(),
          role: "department",
          department: savedDepartment._id,
        });
        await officerUser.save();
      }
    }

    res.status(201).json({
      message: "Department created successfully!",
      department: savedDepartment,
    });
  } catch (error) {
    console.error("Error creating department:", error);

    res.status(500).json({
      message: "Failed to create department: " + (error.message || "Unknown error"),
      error: error.message,
    });
  }
});

app.get("/api/departments", async (req, res) => {
  try {
    const departments = await Department.find();

    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);

    res.status(500).json({
      message: "Failed to fetch departments.",
      error: error.message,
    });
  }
});

// Update department
app.put("/api/departments/:id", async (req, res) => {
  try {
    const { name, description, email, password } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    if (name !== undefined) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    if (email !== undefined) department.email = email.trim().toLowerCase();

    const updated = await department.save();

    // If email or password provided, update the primary department staff account if exists
    if (email || password) {
      if (password && password.trim()) {
        const pwdCheck = validateStrongPassword(password.trim());
        if (!pwdCheck.isValid) {
          return res.status(400).json({
            message: "Department password error: " + pwdCheck.message,
          });
        }
      }

      const officer = await User.findOne({ department: department._id, role: "department" });
      if (officer) {
        if (email) officer.email = email.trim().toLowerCase();
        if (password && password.trim()) officer.password = password.trim();
        await officer.save();
      } else if (email && password) {
        const officerUser = new User({
          name: `${department.name} Officer`,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: "department",
          department: department._id,
        });
        await officerUser.save();
      }
    }

    res.status(200).json({
      message: "Department updated successfully!",
      department: updated,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({
      message: "Failed to update department.",
      error: error.message,
    });
  }
});

// Delete department
app.delete("/api/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    await Department.findByIdAndDelete(id);

    // Delete dedicated department officer accounts associated with this department
    await User.deleteMany({ department: id, role: "department" });
    if (department.email) {
      await User.deleteMany({ email: department.email.trim().toLowerCase(), role: "department" });
    }

    // Safely unassign department from issues and any other users
    await Issue.updateMany({ department: id }, { $set: { department: null } });
    await User.updateMany({ department: id }, { $set: { department: null } });

    res.status(200).json({
      message: `Department "${department.name}" deleted successfully!`,
      id,
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      message: "Failed to delete department.",
      error: error.message,
    });
  }
});

app.put("/api/issues/:id/resolved-photo", upload.single("resolvedPhoto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a resolved photo.",
      });
    }

    const resolvedPhotoUrl = await uploadToCloudinary(req.file.buffer, "fixmycity/resolved_proofs");

    const updateData = {
      resolvedPhoto: resolvedPhotoUrl,
      status: "Resolved", // Completed work photo automatically resolves the complaint
    };

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    res.status(200).json({
      message: "Resolved photo uploaded successfully!",
      issue: issue,
    });
  } catch (error) {
    console.error("Error uploading resolved photo:", error);

    res.status(500).json({
      message: "Failed to upload resolved photo.",
      error: error.message,
    });
  }
});

// Citizen General & Issue Feedback Endpoint
app.post("/api/feedback", async (req, res) => {
  try {
    const { issueId, rating, category, comment } = req.body;
    const userId = req.headers["user-id"];

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Authentication required to submit feedback." });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars." });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Please write a comment or suggestion." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let issueDoc = null;
    let issueTitle = "General Municipal / City Service";

    if (issueId && mongoose.Types.ObjectId.isValid(issueId)) {
      issueDoc = await Issue.findById(issueId);
      if (issueDoc) {
        issueTitle = issueDoc.title;
        // Also sync issue.feedback
        issueDoc.feedback = {
          rating: Math.round(Number(rating)),
          comment: comment.trim(),
          submittedAt: new Date(),
        };
        await issueDoc.save();
      }
    }

    const newFeedback = new Feedback({
      user: user._id,
      userName: user.name || "Citizen",
      issue: issueDoc ? issueDoc._id : null,
      issueTitle: issueTitle,
      rating: Math.round(Number(rating)),
      category: category || "Resolution Quality",
      comment: comment.trim(),
    });

    const savedFeedback = await newFeedback.save();

    res.status(201).json({
      message: "Thank you! Your feedback and rating have been recorded.",
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({
      message: "Failed to submit feedback.",
      error: error.message,
    });
  }
});

// Get feedback list (Citizen sees their own, Admin sees all)
app.get("/api/feedback", async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    let query = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user && user.role === "user") {
        query.user = user._id;
      }
    }

    const list = await Feedback.find(query).populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      message: "Failed to fetch feedback.",
      error: error.message,
    });
  }
});

// Delete feedback entry (Admin)
app.delete("/api/feedback/:id", async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.status(200).json({ message: "Feedback removed successfully." });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      message: "Failed to delete feedback.",
      error: error.message,
    });
  }
});

app.get("/api/location", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required.",
      });
    }

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();

    const locationParts = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);

    const locationName = [...new Set(locationParts)].join(", ");

    res.json({
      location: locationName || "Location unavailable",
    });
  } catch (error) {
    console.error("Location lookup error:", error);

    res.status(500).json({
      message: "Unable to get location.",
    });
  }
});

// =========================================================
// USER MANAGEMENT ENDPOINTS (ADMIN)
// =========================================================

// 1. Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password")
      .populate("department")
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
});

// 1b. Get single user profile
app.get("/api/users/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    const user = await User.findById(req.params.id, "-password").populate("department");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile.", error: error.message });
  }
});

// 2. Create new user (Admin creation)
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const pwdCheck = validateStrongPassword(password);
    if (!pwdCheck.isValid) {
      return res.status(400).json({
        message: pwdCheck.message,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({
      email: { $regex: new RegExp("^" + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
    });
    if (existing) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role || "user",
      department: role === "department" ? (department || null) : null,
    });

    const saved = await newUser.save();
    const populated = await User.findById(saved._id, "-password").populate("department");

    res.status(201).json({
      message: "User created successfully!",
      user: populated,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }
    res.status(500).json({
      message: error.message || "Failed to create user.",
      error: error.message,
    });
  }
});

// 3. Update user profile / role and department
app.put("/api/users/:id", async (req, res) => {
  try {
    const { name, role, department, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (password) {
      const pwdCheck = validateStrongPassword(password);
      if (!pwdCheck.isValid) {
        return res.status(400).json({
          message: pwdCheck.message,
        });
      }
      updateData.password = password;
    }
    if (role) {
      updateData.role = role;
      if (role === "department") {
        updateData.department = department || null;
      } else {
        updateData.department = null;
      }
    } else if (department !== undefined) {
      updateData.department = department || null;
    }

    if (req.body.isBlocked !== undefined) {
      updateData.isBlocked = Boolean(req.body.isBlocked);
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .select("-password")
      .populate("department");

    if (!updated) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "User updated successfully!",
      user: updated,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Failed to update user.",
      error: error.message,
    });
  }
});

// 3b. Toggle Block / Unblock User
app.put("/api/users/:id/block", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Administrators cannot be blocked." });
    }

    user.isBlocked = !user.isBlocked;
    const updated = await user.save();
    console.log(`User ${user.email} block status toggled to: ${user.isBlocked}`);

    res.status(200).json({
      message: `User "${user.name}" has been ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        isBlocked: updated.isBlocked,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error toggling user block status:", error);
    res.status(500).json({
      message: "Failed to update user block status.",
      error: error.message,
    });
  }
});

// 4. Delete user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const currentUserId = req.headers["user-id"];
    if (currentUserId && currentUserId === req.params.id) {
      return res.status(400).json({
        message: "You cannot delete your own admin account while logged in.",
      });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "User deleted successfully!",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Failed to delete user.",
      error: error.message,
    });
  }
});
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
