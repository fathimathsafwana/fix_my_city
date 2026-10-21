const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const User = require("./models/User");
const Department = require("./models/Department");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Create Default Departments if none exist
    const defaultDepartments = [
      { name: "Electricity & Street Lighting", description: "Streetlights, cables, power lines, and electrical fixtures" },
      { name: "Sanitation & Waste Management", description: "Garbage collection, street sweeping, dumpsters, public hygiene" },
      { name: "Roads & Infrastructure", description: "Potholes, broken footpaths, road cracks, road signs" },
      { name: "Water Supply & Drainage", description: "Water pipeline leaks, clogged drains, sewage overflows" }
    ];

    let createdDepts = [];
    for (const dept of defaultDepartments) {
      let existing = await Department.findOne({ name: dept.name });
      if (!existing) {
        existing = await Department.create(dept);
        console.log(`Created Department: ${dept.name}`);
      }
      createdDepts.push(existing);
    }

    // 2. Create / Update Admin Account
    const adminEmail = "admin@gmail.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "City Administrator",
        email: adminEmail,
        password: "Admin@123",
        role: "admin",
        department: null
      });
      console.log(`Created Admin user: ${adminEmail}`);
    } else {
      admin.name = "City Administrator";
      admin.role = "admin";
      admin.password = "Admin@123";
      await admin.save();
      console.log(`Updated Admin user: ${adminEmail}`);
    }

    // 3. Create / Update Department Staff Account
    const deptEmail = "department@gmail.com";
    let deptUser = await User.findOne({ email: deptEmail });
    const primaryDept = createdDepts[0];
    if (!deptUser) {
      deptUser = await User.create({
        name: "Department Officer",
        email: deptEmail,
        password: "Dept@123",
        role: "department",
        department: primaryDept ? primaryDept._id : null
      });
      console.log(`Created Department user: ${deptEmail}`);
    } else {
      deptUser.name = "Department Officer";
      deptUser.role = "department";
      deptUser.password = "Dept@123";
      if (!deptUser.department && primaryDept) {
        deptUser.department = primaryDept._id;
      }
      await deptUser.save();
      console.log(`Updated Department user: ${deptEmail}`);
    }

    // 4. Remove any unwanted dummy seeded citizen accounts
    // Citizens are individual real persons who register their own accounts
    const removedDummy = await User.deleteOne({ email: "user@gmail.com" });
    if (removedDummy.deletedCount > 0) {
      console.log("Removed dummy citizen account: user@gmail.com");
    }

    console.log("\n==========================================");
    console.log("Seeding complete! (Admin & Department only)");
    console.log("Admin:      admin@gmail.com / Admin@123");
    console.log("Department: department@gmail.com / Dept@123");
    console.log("Note: Citizens register their own accounts at /register");
    console.log("==========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
