const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { AppError, ValidationError, NotFoundError } = require("../utils/errors");

// Get my profile
router.get("/me/profile", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { donorProfile: true, requesterProfile: true },
    });
    if (!user) return next(new NotFoundError("User not found"));
    res.json(user);
  } catch (e) {
    next(
      new AppError("Failed to get profile", 500, undefined, {
        details: e.message,
      })
    );
  }
});
module.exports = router;


// Create my profile (first time after signup)
router.post("/me/profile", auth, async (req, res, next) => {
  try {
    // Include donorProfile and requesterProfile in the query
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { donorProfile: true, requesterProfile: true },
    });
    if (!user) return next(new NotFoundError("User not found"));
    if (user.role === "DONOR") {
      if (user.donorProfile)
        return next(new ValidationError("Donor profile already exists"));
      const profile = await prisma.donorProfile.create({
        data: {
          userId: user.id,
          ...req.body,
          lastDonationDate: req.body.lastDonationDate
            ? new Date(req.body.lastDonationDate)
            : undefined,
        },
      });
      return res.json(profile);
    } else if (user.role === "REQUESTER") {
      if (user.requesterProfile)
        return next(new ValidationError("Requester profile already exists"));
      const profile = await prisma.requesterProfile.create({
        data: {
          userId: user.id,
          ...req.body,
        },
      });
      return res.json(profile);
    } else {
      return next(new ValidationError("Invalid user role"));
    }
  } catch (e) {
    next(
      new AppError("Failed to create profile", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// Update my profile
router.put("/me/profile", auth, async (req, res, next) => {
  // ...existing code...
  module.exports = router;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) return next(new NotFoundError("User not found"));
    let data = {};
    if (user.role === "DONOR") {
      const updateData = { ...req.body };
      if (updateData.lastDonationDate) {
        updateData.lastDonationDate = new Date(updateData.lastDonationDate);
      }
      data.donorProfile = { update: updateData };
    } else if (user.role === "REQUESTER") {
      data.requesterProfile = { update: req.body };
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      include: { donorProfile: true, requesterProfile: true },
    });
    res.json(updated);
  } catch (e) {
    next(
      new AppError("Failed to update profile", 500, undefined, {
        details: e.message,
      })
    );
  }
});

