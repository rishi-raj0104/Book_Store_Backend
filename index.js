const express = require('express');
const app = express();
const mongoose = require("mongoose");
const cors = require('cors'); 
require('dotenv').config();
// middleware
app.use(express.json());

app.use(cors({
    origin: ['http://localhost:5173','https://book-store-mu-two.vercel.app/'],
    credentials: true
}))
// routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require("./src/orders/order.route");
const userRoutes =  require("./src/users/user.route");
const adminRoutes = require("./src/stats/admin.stats");
const paymentRoutes = require("./src/payment/paymentroute");

app.use("/api/books", bookRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/auth", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/v1/payment", paymentRoutes);

const port = process.env.PORT || 5000;
app.use('/', (req, res) => {
  res.send('Welcome to world of routes');
})
async function main() {
    await mongoose.connect(process.env.DB_URL);
    app.use("/", (req, res) => {
      res.send("Book Store Server is running!");
    });
  }

main().then(() => console.log("Mongodb connect successfully!")).catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})