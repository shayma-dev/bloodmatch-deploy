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

// GET /requests/dashboard (Requester-only)
router.get("/requester-dashboard", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { requesterProfile: true },
    });
    if (!user || user.role !== "REQUESTER") {
      return next(new AppError("Only requesters can access dashboard", 403));
    }
    const requester = user.requesterProfile;
    if (!requester) {
      return next(new ValidationError("Requester profile not found"));
    }

    // Fetch core data
    const [requests, countsByStatus, recentApplicants] = await Promise.all([
      prisma.request.findMany({
        where: { requesterId: requester.userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { applications: true } },
        },
        take: 20, // cap to keep payload small
      }),

      // Aggregate counts per status
      prisma.request.groupBy({
        by: ["status"],
        where: { requesterId: requester.userId },
        _count: { status: true },
      }),

      // Most recent applicants across ALL of this requester's requests
      prisma.application.findMany({
        where: {
          request: { requesterId: requester.userId },
        },
        include: {
          request: {
            select: { id: true, bloodType: true, urgency: true, city: true },
          },
          donor: {
            select: {
              userId: true,
              name: true,
              phone: true,
              bloodType: true,
              city: true,
              country: true,
              lastDonationDate: true,
              photoURL: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    // Compute stats
    const statusMap = countsByStatus.reduce((acc, row) => {
      acc[row.status] = row._count.status || 0;
      return acc;
    }, { Open: 0, Resolved: 0, Cancelled: 0 });

    const totalApplicants = requests.reduce(
      (sum, r) => sum + (r._count?.applications || 0),
      0
    );

    // Transform lists
    const recentRequests = requests.slice(0, 8).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      status: r.status,
      bloodType: r.bloodType,
      unitsNeeded: r.unitsNeeded,
      urgency: r.urgency,
      city: r.city,
      country: r.country,
      applicantCount: r._count?.applications || 0,
    }));

    const recentApplicantsSlim = recentApplicants.map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      status: a.status, // if you track status on applications
      request: a.request,
      donor: {
        userId: a.donor.userId,
        name: a.donor.name,
        phone: a.donor.phone,
        email: a.donor.user?.email || null,
        bloodType: a.donor.bloodType,
        city: a.donor.city,
        country: a.donor.country,
        lastDonationDate: a.donor.lastDonationDate,
        photoURL: a.donor.photoURL,
      },
    }));

    res.json({
      stats: {
        openRequests: statusMap.Open || 0,
        resolvedRequests: statusMap.Resolved || 0,
        cancelledRequests: statusMap.Cancelled || 0,
        totalApplicants,
        recentActivity: recentApplicantsSlim.length,
      },
      recentRequests,
      recentApplicants: recentApplicantsSlim,
    });
  } catch (e) {
    next(
      new AppError("Failed to load requester dashboard", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// POST /requests (Requester-only)
router.post("/", auth, async (req, res, next) => {
  try {
    // Only requester can create requests
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { requesterProfile: true },
    });
    if (!user || user.role !== "REQUESTER") {
      return next(new AppError("Only requesters can create requests", 403));
    }
    if (!user.requesterProfile) {
      return next(new ValidationError("Requester profile not found"));
    }
    const { bloodType, unitsNeeded, urgency, caseDescription, city, country } =
      req.body;
    // Validation
    const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const validUrgency = ["Low", "Normal", "High", "Critical"];
    if (!bloodType || !validBloodTypes.includes(bloodType)) {
      return next(new ValidationError("Invalid or missing bloodType"));
    }
    if (!unitsNeeded || typeof unitsNeeded !== "number" || unitsNeeded < 1) {
      return next(new ValidationError("unitsNeeded must be an integer ≥ 1"));
    }
    if (!urgency || !validUrgency.includes(urgency)) {
      return next(new ValidationError("Invalid or missing urgency"));
    }
    if (!caseDescription || caseDescription.length > 300) {
      return next(
        new ValidationError(
          "caseDescription is required and must be ≤ 300 chars"
        )
      );
    }
    // Use profile city/country if not provided
    const reqCity = city || user.requesterProfile.city;
    const reqCountry = country || user.requesterProfile.country;
    if (!reqCity || !reqCountry) {
      return next(new ValidationError("city and country are required"));
    }
    const request = await prisma.request.create({
      data: {
        requesterId: user.requesterProfile.userId,
        bloodType,
        unitsNeeded,
        urgency,
        caseDescription,
        status: "Open",
        city: reqCity,
        country: reqCountry,
      },
    });
    res.status(201).json(request);
  } catch (e) {
    next(
      new AppError("Failed to create request", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// PATCH /requests/:id (Requester-only) — edits 3 fields + status in one endpoint
router.patch("/:id", auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Auth: requester only
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { requesterProfile: true },
    });
    if (!user || user.role !== "REQUESTER") {
      return next(new AppError("Only requesters can edit requests", 403));
    }
    if (!user.requesterProfile) {
      return next(new ValidationError("Requester profile not found"));
    }

    // Fetch and ownership check
    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) return next(new NotFoundError("Request not found"));
    if (existing.requesterId !== user.requesterProfile.userId) {
      return next(new AppError("You do not own this request", 403));
    }

    // Allowed fields only (explicitly exclude city/country/bloodType from edit)
    const allowed = ["unitsNeeded", "urgency", "caseDescription", "status"];
    const payloadKeys = Object.keys(req.body || {});
    const disallowed = payloadKeys.filter((k) => !allowed.includes(k));
    if (disallowed.length > 0) {
      return next(
        new ValidationError(
          `Only editable fields: ${allowed.join(", ")}`
        )
      );
    }

    const {
      unitsNeeded,
      urgency,
      caseDescription,
      status, // optional
    } = req.body;

    const data = {};

    // Validation lists (aligned with your POST)
    const validUrgency = ["Low", "Normal", "High", "Critical"];
    const validStatuses = ["Open", "Resolved", "Cancelled"];

    // 1) If editing the three fields, only allow when current status is Open
    const isEditingCore =
      typeof unitsNeeded !== "undefined" ||
      typeof urgency !== "undefined" ||
      typeof caseDescription !== "undefined";

    if (isEditingCore && existing.status !== "Open") {
      return next(
        new ValidationError("Only 'Open' requests can edit units/urgency/description")
      );
    }

    // 2) Validate and set the three editable fields
    if (typeof unitsNeeded !== "undefined") {
      if (
        typeof unitsNeeded !== "number" ||
        !Number.isInteger(unitsNeeded) ||
        unitsNeeded < 1
      ) {
        return next(new ValidationError("unitsNeeded must be an integer ≥ 1"));
      }
      data.unitsNeeded = unitsNeeded;
    }

    if (typeof urgency !== "undefined") {
      if (!validUrgency.includes(urgency)) {
        return next(new ValidationError("Invalid urgency"));
      }
      data.urgency = urgency;
    }

    if (typeof caseDescription !== "undefined") {
      if (!caseDescription || caseDescription.length > 300) {
        return next(
          new ValidationError(
            "caseDescription is required and must be ≤ 300 chars"
          )
        );
      }
      data.caseDescription = String(caseDescription).trim();
    }

    // 3) Validate and set status if provided
    if (typeof status !== "undefined") {
      if (!validStatuses.includes(status)) {
        return next(
          new ValidationError("Status must be 'Open', 'Resolved', or 'Cancelled'")
        );
      }

      // Your previous route logic checks:
      // - Avoid setting the same status
      if (status === existing.status) {
        return next(new ValidationError(`Request is already '${status}'`));
      }

      // If you want to disallow reopening to Open from non-Open, add a guard.
      // Currently your status route allows change but rejects "already Open".
      // We keep parity: allow changing to any of the valid statuses.
      data.status = status;
    }

    // 4) If no changes, return existing
    if (Object.keys(data).length === 0) {
      return res.json(existing);
    }

    const updated = await prisma.request.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (e) {
    next(
      new AppError("Failed to update request", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// GET /my/requests (Requester-only)
router.get("/my/requests", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { requesterProfile: true },
    });
    if (!user || user.role !== "REQUESTER") {
      return next(new AppError("Only requesters can view their requests", 403));
    }
    if (!user.requesterProfile) {
      return next(new ValidationError("Requester profile not found"));
    }
    const requests = await prisma.request.findMany({
      where: { requesterId: user.requesterProfile.userId },
      orderBy: { createdAt: "desc" },
      include: { applications: true },
    });
    // Add applicant count to each request
    const result = requests.map((r) => ({
      ...r,
      applicantCount: r.applications.length,
      applications: undefined, // hide full applications array
    }));
    res.json(result);
  } catch (e) {
    next(
      new AppError("Failed to fetch my requests", 500, undefined, {
        details: e.message,
      })
    );
  }
});

// GET /requests/:id/applicants (Requester-only)
router.get("/:id/applicants", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new ValidationError("Request ID is required"));

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { requesterProfile: true },
    });
    if (!user || user.role !== "REQUESTER") {
      return next(new AppError("Only requesters can view applicants", 403));
    }
    if (!user.requesterProfile) {
      return next(new ValidationError("Requester profile not found"));
    }

    // Ownership check (select minimal fields)
    const request = await prisma.request.findUnique({
      where: { id },
      select: { id: true, requesterId: true },
    });
    if (!request) return next(new NotFoundError("Request not found"));
    if (request.requesterId !== user.requesterProfile.userId) {
      return next(new AppError("You do not own this request", 403));
    }

    // Include donor profile fields (name, phone, photoURL, etc.) and user.email for contact
    const applications = await prisma.application.findMany({
      where: { requestId: id },
      include: {
        donor: {
          select: {
            userId: true,
            name: true,              // from DonorProfile
            phone: true,             // from DonorProfile
            bloodType: true,         // from DonorProfile
            lastDonationDate: true,  // from DonorProfile
            city: true,              // from DonorProfile
            country: true,           // from DonorProfile
            photoURL: true,          // from DonorProfile (note the casing)
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(applications);
  } catch (e) {
    next(
      new AppError("Failed to fetch applicants", 500, undefined, {
        details: e.message,
      })
    );
  }
});

module.exports = router;
