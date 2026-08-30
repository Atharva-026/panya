import express from "express";
import passport from "passport";
import { sendWelcomeEmail } from "../utils/email.js";

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/signin" }),
  (req, res) => {
    res.redirect("http://localhost:5173/chat");
  }
);

router.get("/me", (req, res) => {
  if (req.user) {
    res.json({ authenticated: true, user: { id: req.user._id, name: req.user.name, email: req.user.email } });
  } else {
    res.json({ authenticated: false });
  }
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

router.post("/guest-welcome", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  sendWelcomeEmail(email, name).catch((err) => console.error("Guest welcome email failed:", err));
  res.json({ success: true });
});

export default router;