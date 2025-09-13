require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

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
