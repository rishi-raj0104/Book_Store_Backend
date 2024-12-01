const express = require('express');
const router = express.Router();
const { auth } = require("./auth");
const { capturePayment, verifyPayment } = require('./payment.controller');

// Define the routes
router.post("/capturePayment", capturePayment);
router.post("/verifyPayment", verifyPayment);

module.exports = router;
