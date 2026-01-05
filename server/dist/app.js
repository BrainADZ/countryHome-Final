import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.js";
import connectDB from "./config/db.js";
const app = express();
app.use(express.json());
// middlewares
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://countryhome.co.in",
    "http://www.countryhome.co.in/"
].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // allow server-to-server / postman (no origin)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api", routes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
connectDB();
export default app;
