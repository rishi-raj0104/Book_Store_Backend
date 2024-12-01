const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://book-store-mu-two.vercel.app/'],
  credentials: true
}));

// Routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require("./src/orders/order.route");
const userRoutes = require("./src/users/user.route");
const adminRoutes = require("./src/stats/admin.stats");
const paymentRoutes = require("./src/payment/paymentroute");

app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.use('/', (req, res) => {
  res.send('Welcome to the world of routes');
});

// MongoDB connection
async function main() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Mongodb connected successfully!");
  } catch (err) {
    console.log(err);
  }
}

main();

module.exports = app;
