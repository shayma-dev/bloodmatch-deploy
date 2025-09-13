const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create a requester user and profile
  let requesterUser;
  try {
    requesterUser = await prisma.user.create({
      data: {
        email: "requester@example.com",
        passwordHash: "hashedpassword",
        role: "REQUESTER",
        requesterProfile: {
          create: {
            name: "Requester One",
            category: "HOSPITAL",
            phone: "1234567890",
            city: "CityA",
            country: "CountryA",
            addressLine: "123 Main St",
          },
        },
      },
      include: { requesterProfile: true },
    });
  } catch (e) {
    console.error("Error creating requester user:", e);
  }

  // Create a donor user and profile
  let donorUser;
  try {
    donorUser = await prisma.user.create({
      data: {
        email: "donor@example.com",
        passwordHash: "hashedpassword",
        role: "DONOR",
        donorProfile: {
          create: {
            name: "Donor One",
            phone: "0987654321",
            bloodType: "A+",
            lastDonationDate: new Date("2025-06-01"),
            city: "CityA",
            country: "CountryA",
            addressLine: "456 Side St",
            photoURL: null,
          },
        },
      },
      include: { donorProfile: true },
    });
  } catch (e) {
    console.error("Error creating donor user:", e);
  }

  // Create a request
  let request;
  try {
    request = await prisma.request.create({
      data: {
        requesterId: requesterUser?.requesterProfile?.userId,
        bloodType: "A+",
        unitsNeeded: 2,
        urgency: "High",
        caseDescription: "Urgent need for A+ blood",
        status: "Open",
        city: "CityA",
        country: "CountryA",
      },
    });
  } catch (e) {
    console.error("Error creating request:", e);
  }

  // Create an application
  try {
    await prisma.application.create({
      data: {
        requestId: request?.id,
        donorId: donorUser?.donorProfile?.userId,
        status: "Applied",
      },
    });
  } catch (e) {
    console.error("Error creating application:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
