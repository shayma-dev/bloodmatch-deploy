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
    const authUserId = req.user?.id;

    if (!id) return next(new ValidationError("Request ID is required"));

    // Pull request + requester + counts + my application for current user
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
        applications: {
          where: { donorId: authUserId },
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { applications: true } },
      },
    });

    if (!request) return next(new NotFoundError("Request not found"));

    const isOwner = request.requester?.userId === authUserId;
    const myApplication = request.applications?.[0] || null;
    const hasActiveApplication = myApplication?.status === "Applied";

    // Build a response object we can safely mutate
    const result = {
      ...request,
      myApplication,
      hasActiveApplication,
      ownerView: isOwner,
    };

    // Privacy gating: strip contact from requester for non-owners without an active application
    if (!isOwner && !hasActiveApplication && result.requester) {
      result.requester = {
        ...result.requester,
        // Keep identity/location
        name: result.requester.name,
        city: result.requester.city,
        country: result.requester.country,
        category: result.requester.category,
        addressLine: result.requester.addressLine,
        user: result.requester.user ? { id: result.requester.user.id } : null,
        // Strip phone and email
        phone: undefined,
      };
      // If you also want to hide email, already handled by setting user to { id } only
    }

    // Clean up: remove the applications array we used for "myApplication"
    delete result.applications;

    res.json(result);
  } catch (e) {
    next(new AppError("Failed to fetch request", 500, undefined, { details: e.message }));
  }
});

module.exports = router;
