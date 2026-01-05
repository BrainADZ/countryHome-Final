import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.model.js";
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin)
            return res.status(404).json({ message: "Admin not found" });
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({
            id: admin._id,
            role: "admin"
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.json({
            message: "Login successful",
            token, // IMPORTANT
            admin: {
                id: admin._id,
                email: admin.email,
                // name: admin.name, 
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login failed" });
    }
};
