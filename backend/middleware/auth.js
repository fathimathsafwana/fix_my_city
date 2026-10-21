const User = require("../models/User");
const mongoose = require("mongoose");

async function auth(req, res, next) {
    try {
        const userId = req.headers["user-id"];

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            req.user = null;
            return next();
        }

        const user = await User.findById(userId);
        req.user = user || null;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        req.user = null;
        next();
    }
}

module.exports = auth;