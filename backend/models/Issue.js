const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: false,
      default: "General",
    },

    description: {
      type: String,
      required: false,
      default: "",
    },

    latitude: {
      type: Number,
      required: false,
      default: 0,
    },

    longitude: {
      type: Number,
      required: false,
      default: 0,
    },
    photo: {
      type: String,
      default: null,
    },
    resolvedPhoto: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "Verified", "In Progress", "Resolved", "Rejected", "Submitted", "Assigned"],
      default: "Pending",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: "",
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);