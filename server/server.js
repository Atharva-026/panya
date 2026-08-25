import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import session from "express-session";
import passport from "./config/passport.js";
import authRouter from "./routes/auth.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import ordersRouter from "./routes/orders.js";
import chatRouter from "./routes/chat.js";
import merchantRouter from "./routes/merchant.js";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use(express.static(path.join(__dirname, "..", "public")));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/order", ordersRouter);
app.use("/api/chat", chatRouter);
app.use("/api/merchant", merchantRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));