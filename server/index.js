require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Step 2: Verify DATABASE_URL actually loaded in production ---
// Mask password in logs while keeping the rest visible for comparison.
function maskDbUrl(url) {
  if (!url) return "(undefined)";
  try {
    // Replace password part in: protocol://user:password@host/...
    return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1****$2");
  } catch {
    return "(unparseable)";
  }
}

const effectiveDbUrl = process.env.DATABASE_URL;
console.log("[BOOT] DATABASE_URL (masked):", maskDbUrl(effectiveDbUrl));

// Optional: warn if empty or suspicious
if (!effectiveDbUrl) {
  console.warn("[BOOT][WARN] DATABASE_URL is not defined. Prisma/DB will fail.");
}
if (/\s/.test(effectiveDbUrl || "")) {
  console.warn("[BOOT][WARN] DATABASE_URL contains whitespace; double-check your env var.");
}

// ---------------------------------------------------------------

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/profile"));
app.use("/requests", require("./routes/requests/router"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Standardized error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.error || "AppError",
    message: err.message || "Something went wrong",
    details: err.details || {},
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});