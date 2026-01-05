import jwt from "jsonwebtoken";
export const signAdminToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};
