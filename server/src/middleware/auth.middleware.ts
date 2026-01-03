import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized: Invalid admin" });
    }

    req.admin = admin; // IMPORTANT
    next();
  } catch (err) {
    console.log("Admin Auth Error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
