import express from "express";
import passport from "passport";

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

export default router;