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
const auth = require("./middleware/auth");
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });



app.get("/", (req, res) => {
  res.send("Smart Civic Issue Reporting System Backend is running!");
});
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists.",
      });
    }

    const user = new User({
      name,
      email,
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

    res.status(500).json({
      message: "Failed to register user.",
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

    const issueData = {
      title,
      category,
      description,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      photo: photoUrl,
      status: "Submitted",
      department: department && mongoose.Types.ObjectId.isValid(department) ? department : null,
      user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    };

    const issue = new Issue(issueData);
    const savedIssue = await issue.save();

    console.log("New civic issue saved:", savedIssue);

    res.status(201).json({
      message: "Civic issue saved successfully!",
      issue: savedIssue,
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

    const issues = await Issue.find(query).sort({ createdAt: -1 });
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

    if (status === "Resolved" && !existing.resolvedPhoto) {
      return res.status(400).json({
        message: "Photo proof of completed work is required before marking a complaint as Resolved.",
      });
    }

    existing.status = status;
    const issue = await existing.save();

    res.status(200).json({
      message: "Complaint status updated successfully!",
      issue: issue,
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

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (title !== undefined) issue.title = title;
    if (category !== undefined) issue.category = category;
    if (description !== undefined) issue.description = description;
    if (status !== undefined) issue.status = status;
    if (department !== undefined) issue.department = department || null;
    if (priority !== undefined) issue.priority = priority;

    const updated = await issue.save();
    const populated = await Issue.findById(updated._id).populate("department");
    res.status(200).json({
      message: "Complaint details updated successfully!",
      issue: populated,
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
    const deleted = await Issue.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Complaint not found." });
    }
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

    if (!name || !description) {
      return res.status(400).json({
        message: "Department name and description are required.",
      });
    }

    // Check if email already exists in User collection
    if (email) {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: `A user account with email "${email}" already exists.`,
        });
      }
    }

    const department = new Department({
      name: name.trim(),
      description: description.trim(),
      email: email ? email.trim().toLowerCase() : "",
    });

    const savedDepartment = await department.save();

    // If email and password provided, automatically create official department officer login user
    if (email && password) {
      const officerUser = new User({
        name: `${name.trim()} Officer`,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: "department",
        department: savedDepartment._id,
      });
      await officerUser.save();
    }

    res.status(201).json({
      message: "Department created successfully!",
      department: savedDepartment,
    });
  } catch (error) {
    console.error("Error creating department:", error);

    res.status(500).json({
      message: "Failed to create department.",
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
      const officer = await User.findOne({ department: department._id, role: "department" });
      if (officer) {
        if (email) officer.email = email.trim().toLowerCase();
        if (password) officer.password = password.trim();
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

    // Safely unassign department from issues and users
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

// Submit citizen feedback and rating for a resolved complaint
app.post("/api/issues/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.headers["user-id"];

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "Please provide a valid rating between 1 and 5 stars.",
      });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    // Check ownership if user-id provided
    if (userId && issue.user && String(issue.user) !== String(userId)) {
      return res.status(403).json({
        message: "You can only submit feedback for your own complaints.",
      });
    }

    if (issue.status !== "Resolved") {
      return res.status(400).json({
        message: "Feedback can only be submitted once the complaint is marked as Resolved.",
      });
    }

    issue.feedback = {
      rating: Math.round(Number(rating)),
      comment: comment ? String(comment).trim() : "",
      submittedAt: new Date(),
    };

    const updatedIssue = await issue.save();
    console.log(`Feedback submitted for issue ${id}: rating=${rating}`);

    res.status(200).json({
      message: "Thank you! Your feedback and rating have been recorded.",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      message: "Failed to submit feedback.",
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

app.put("/api/issues/:id/department", async (req, res) => {
  try {
    const { department } = req.body;

    const existing = await Issue.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    const updateData = { department: department || null };
    // Automatically transition status to "Assigned" if currently "Submitted" or "Verified"
    if (department && (existing.status === "Submitted" || existing.status === "Verified")) {
      updateData.status = "Assigned";
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    console.log(`Assigned issue ${req.params.id} to department: ${department}, status: ${issue.status}`);

    res.status(200).json({
      message: "Department assigned successfully!",
      issue: issue,
    });
  } catch (error) {
    console.error("Error assigning department:", error);

    res.status(500).json({
      message: "Failed to assign department.",
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

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }

    const newUser = new User({
      name,
      email,
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
    res.status(500).json({
      message: "Failed to create user.",
      error: error.message,
    });
  }
});

// 3. Update user profile / role and department
app.put("/api/users/:id", async (req, res) => {
  try {
    const { name, role, department, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (password) updateData.password = password;
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
