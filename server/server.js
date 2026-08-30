import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import MongoStore from "connect-mongo";

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
import userRouter from "./routes/user.js";
import autoOrderRouter from "./routes/autoOrder.js";
import { startInsightScheduler } from "./cron/insightCron.js";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: process.env.SECURE_COOKIES === "true" ? "none" : "lax",
    },
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
app.use("/api/user", userRouter);
app.use("/api/auto-order", autoOrderRouter);

if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startInsightScheduler();