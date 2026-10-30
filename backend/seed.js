const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const User = require("./models/User");
const Department = require("./models/Department");
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Create Default Departments if none exist (The 3 official municipal departments)
    const defaultDepartments = [
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
        name: "Admin",
        email: adminEmail,
        password: "Admin@123",
        role: "admin",
        department: null
      });
      console.log(`Created Admin user: ${adminEmail}`);
    } else {
      admin.name = "Admin";
      admin.role = "admin";
      admin.password = "Admin@123";
      await admin.save();
      console.log(`Updated Admin user: ${adminEmail}`);
    }

    // 3. Remove legacy / general department accounts (Only dedicated department accounts are used)
    await User.deleteOne({ email: "department@gmail.com" });

    // 4. Create / Update Dedicated Department Logins for the 3 municipal departments
    const deptLogins = [
      { email: "sanitation@gmail.com", name: "Sanitation Officer", password: "Sanitation@123", deptName: "Sanitation & Waste Management" },
      { email: "roads@gmail.com", name: "Roads Officer", password: "Roads@123", deptName: "Roads & Infrastructure" },
      { email: "water@gmail.com", name: "Water Supply Officer", password: "Water@123", deptName: "Water Supply & Drainage" },
    ];

    for (const dLogin of deptLogins) {
      const targetDept = createdDepts.find((d) => d.name === dLogin.deptName);
      if (!targetDept) continue;

      let existingOfficer = await User.findOne({ email: dLogin.email });
      if (!existingOfficer) {
        await User.create({
          name: dLogin.name,
          email: dLogin.email,
          password: dLogin.password,
          role: "department",
          department: targetDept._id,
        });
        console.log(`Created dedicated department officer: ${dLogin.email} (${dLogin.deptName})`);
      } else {
        existingOfficer.name = dLogin.name;
        existingOfficer.role = "department";
        existingOfficer.password = dLogin.password;
        existingOfficer.department = targetDept._id;
        await existingOfficer.save();
        console.log(`Updated dedicated department officer: ${dLogin.email} (${dLogin.deptName})`);
      }
    }

    // 5. Clean up any unwanted dummy citizen accounts
    const removedDummy = await User.deleteOne({ email: "user@gmail.com" });
    if (removedDummy.deletedCount > 0) {
      console.log("Removed dummy citizen account: user@gmail.com");
    }

    console.log("\n==========================================");
    console.log("Seeding complete! (3 Official Dedicated Departments)");
    console.log("Admin: admin@gmail.com / Admin@123");
    console.log("Sanitation Dept: sanitation@gmail.com / Sanitation@123");
    console.log("Roads Dept: roads@gmail.com / Roads@123");
    console.log("Water Dept: water@gmail.com / Water@123");
    console.log("==========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
