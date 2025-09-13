const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

const { AppError, ValidationError, AuthError } = require("../utils/errors");

// Signup
router.post("/signup", async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return next(new ValidationError("Missing required fields"));
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return next(
        new ValidationError("Email already in use", { field: "email" })
      );
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, role },
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (e) {
    next(new AppError("Signup failed", 500, undefined, { details: e.message }));
  }
});

// Login
router.post("/login", async (req, res, next) => {
  // ...existing code...
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ValidationError("Missing email or password"));
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new AuthError("Invalid credentials"));
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return next(new AuthError("Invalid credentials"));
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (e) {
    next(new AppError("Login failed", 500, undefined, { details: e.message }));
  }
});

module.exports = router;
