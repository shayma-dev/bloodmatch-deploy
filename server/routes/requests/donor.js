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


// GET /requests/dashboard
router.get("/donor-dashboard", auth, async (req, res, next) => {
  try {
    const authUserId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can access dashboard", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }

    const bloodType = user.donorProfile.bloodType.trim().toUpperCase();
    const city = user.donorProfile.city.trim();
    const country = user.donorProfile.country.trim();

    // Matching count based on same criteria as your /requests route
    const matchingRequests = await prisma.request.count({
      where: {
        status: "Open",
        bloodType,
        city: { equals: city, mode: "insensitive" },
        country: { equals: country, mode: "insensitive" },
      },
    });

    const [applicationsApplied, applicationsWithdrawn, recommended, recentApplications] = await Promise.all([
      prisma.application.count({
        where: { donorId: authUserId, status: "Applied" },
      }),
      prisma.application.count({
        where: { donorId: authUserId, status: "Withdrawn" },
      }),
      prisma.request.findMany({
        where: {
          status: "Open",
          bloodType,
          city: { equals: city, mode: "insensitive" },
          country: { equals: country, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bloodType: true,
          unitsNeeded: true,
          urgency: true,
          city: true,
          country: true,
          createdAt: true,
        },
      }),
      prisma.application.findMany({
        where: { donorId: authUserId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          request: {
            select: {
              id: true,
              bloodType: true,
              urgency: true,
              city: true,
            },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        matchingRequests,
        applicationsApplied,
        applicationsWithdrawn,
        lastDonationDate: user.donorProfile.lastDonationDate
          ? user.donorProfile.lastDonationDate.toISOString()
          : null,
      },
      recommended,
      recentApplications,
    });
  } catch (e) {
    next(
      new AppError("Failed to load donor dashboard", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// POST /requests/last-donation
router.post("/last-donation", auth, async (req, res, next) => {
  try {
    const authUserId = req.user.userId;
    const { date } = req.body || {};

    // Load user + donorProfile
    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can update last donation date", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }

    // Validate body
    if (!date || typeof date !== "string") {
      return next(new ValidationError("A valid 'date' string is required"));
    }

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return next(new ValidationError("Invalid date format"));
    }

    // Update lastDonationDate
    const updated = await prisma.donorProfile.update({
      where: { userId: authUserId },
      data: { lastDonationDate: parsed },
      select: { lastDonationDate: true },
    });

    res.json({
      lastDonationDate: updated.lastDonationDate
        ? updated.lastDonationDate.toISOString()
        : null,
    });
  } catch (e) {
    next(
      new AppError("Failed to update last donation date", 500, undefined, {
        details: e.message,
      })
    );
  }
});

module.exports = router;

// GET /requests (Donor-only)
router.get("/", auth, async (req, res, next) => {
  try {
    const authUserId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can view matching requests", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }

    // Normalize donor filters
    const bloodType = user.donorProfile.bloodType.trim().toUpperCase();
    const city = user.donorProfile.city.trim();
    const country = user.donorProfile.country.trim();

    // Find matching requests and fetch only THIS user's latest application for each
    const requests = await prisma.request.findMany({
      where: {
        status: "Open",
        bloodType,
        city: { equals: city, mode: "insensitive" },
        country: { equals: country, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          where: { donorId: authUserId },
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Shape the response: derive boolean and keep last app if you need it
    const result = requests.map((r) => {
      const myApplication = r.applications?.[0] || null;
      const hasActiveApplication = myApplication?.status === "Applied";
      const { applications, ...rest } = r;
      return { ...rest, myApplication, hasActiveApplication };
    });

    res.json(result);
  } catch (e) {
    next(new AppError("Failed to fetch requests", 500, undefined, { details: e.message }));
  }
});

// POST /requests/:id/apply (Donor-only)
router.post("/:id/apply", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new ValidationError("Request ID is required"));
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can apply to requests", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }
    // Check eligibility (54-day cooldown)
    const lastDonation = user.donorProfile.lastDonationDate;
    if (!lastDonation || isNaN(new Date(lastDonation))) {
      return next(new ValidationError("Invalid or missing lastDonationDate"));
    }
    const daysSince = Math.floor(
      (Date.now() - new Date(lastDonation)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 54) {
      return next(
        new ValidationError(
          `You are not eligible to donate for ${54 - daysSince} more days.`
        )
      );
    }
    // Find the request
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return next(new NotFoundError("Request not found"));
    if (request.status !== "Open") {
      return next(new ValidationError("Can only apply to Open requests"));
    }
    // Check blood type, city, country match (case-insensitive, trimmed)
    const donorBloodType = user.donorProfile.bloodType.trim().toUpperCase();
    const donorCity = user.donorProfile.city.trim().toLowerCase();
    const donorCountry = user.donorProfile.country.trim().toLowerCase();
    const reqBloodType = request.bloodType.trim().toUpperCase();
    const reqCity = request.city.trim().toLowerCase();
    const reqCountry = request.country.trim().toLowerCase();
    if (
      reqBloodType !== donorBloodType ||
      reqCity !== donorCity ||
      reqCountry !== donorCountry
    ) {
      return next(
        new ValidationError(
          "Request does not match your blood type or location"
        )
      );
    }
    // Prevent duplicate active applications
    const existing = await prisma.application.findFirst({
      where: {
        requestId: id,
        donorId: user.donorProfile.userId,
        status: "Applied",
      },
    });
    if (existing) {
      return next(
        new ValidationError("You have already applied to this request")
      );
    }
    // Create application
    const application = await prisma.application.create({
      data: {
        requestId: id,
        donorId: user.donorProfile.userId,
        status: "Applied",
      },
    });
    res.status(201).json(application);
  } catch (e) {
    next(
      new AppError("Failed to apply to request", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// POST /applications/:id/withdraw (Donor-only)
router.post("/applications/:id/withdraw", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new ValidationError("Application ID is required"));
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can withdraw applications", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }
    // Find the application
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) return next(new NotFoundError("Application not found"));
    if (application.donorId !== user.donorProfile.userId) {
      return next(new AppError("You do not own this application", 403));
    }
    if (application.status !== "Applied") {
      return next(
        new ValidationError("Only 'Applied' applications can be withdrawn")
      );
    }
    // Update status to Withdrawn
    const updated = await prisma.application.update({
      where: { id },
      data: { status: "Withdrawn" },
    });
    res.json(updated);
  } catch (e) {
    next(
      new AppError("Failed to withdraw application", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// GET /my/applications (Donor-only)
router.get("/my/applications", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { donorProfile: true },
    });
    if (!user || user.role !== "DONOR") {
      return next(new AppError("Only donors can view their applications", 403));
    }
    if (!user.donorProfile) {
      return next(new ValidationError("Donor profile not found"));
    }
    const applications = await prisma.application.findMany({
      where: { donorId: user.donorProfile.userId },
      include: {
        request: {
          select: {
            id: true,
            bloodType: true,
            city: true,
            country: true,
            status: true,
            unitsNeeded: true,
            urgency: true,
            caseDescription: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (e) {
    next(
      new AppError("Failed to fetch my applications", 500, undefined, {
        details: e.message,
      })
    );
  }
});

module.exports = router;
