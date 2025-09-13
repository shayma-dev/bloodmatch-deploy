const express = require("express");
const router = express.Router();

const requesterRoutes = require("./requester");
const donorRoutes = require("./donor");
const commonRoutes = require("./common");

router.use("/", requesterRoutes);
router.use("/", donorRoutes);
router.use("/", commonRoutes);

module.exports = router;
