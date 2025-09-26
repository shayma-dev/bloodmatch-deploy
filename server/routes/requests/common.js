const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../../middleware/auth");
const {
  AppError,
  ValidationError,
  NotFoundError,
} = require("../../utils/errors");

// GET /requests/:id (authorized)
// Behavior:
// - Owner (requester) gets full requester contact info + applicant count
// - Donor with active application (status "Applied") sees requester contact
// - Other donors see requester identity/location but NOT phone/email
router.get("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const authUserId = req.user?.userId; // IMPORTANT: userId, not id

    if (!id) return next(new ValidationError("Request ID is required"));

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            userId: true,
            name: true,
            phone: true,
            category: true,
            city: true,
            country: true,
            addressLine: true,
            user: { select: { id: true, email: true } },
          },
        },
        // Only fetch THIS user's latest application for this request
        applications: authUserId
          ? {
              where: { donorId: authUserId },
              select: { id: true, status: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            }
          : false,
        _count: { select: { applications: true } },
      },
    });

    if (!request) return next(new NotFoundError("Request not found"));

    const isOwner = request.requester?.userId === authUserId;

    const myApplication = Array.isArray(request.applications)
      ? request.applications[0] || null
      : null;

    const hasActiveApplication = myApplication?.status === "Applied";

    const result = {
      ...request,
      myApplication,
      hasActiveApplication,
      ownerView: isOwner,
    };

    // Privacy gating for non-owners with no active app
    if (!isOwner && !hasActiveApplication && result.requester) {
      result.requester = {
        ...result.requester,
        name: result.requester.name,
        city: result.requester.city,
        country: result.requester.country,
        category: result.requester.category,
        addressLine: result.requester.addressLine,
        user: result.requester.user ? { id: result.requester.user.id } : null,
        phone: undefined, // strip phone
      };
    }

    delete result.applications;

    // Prevent caching and ensure per-user caches
    res.set("Cache-Control", "no-store");
    res.set("Vary", "Authorization");

    res.json(result);
  } catch (e) {
    next(
      new AppError("Failed to fetch request", 500, undefined, {
        details: e.message,
      })
    );
  }
});

module.exports = router;

module.exports = router;
