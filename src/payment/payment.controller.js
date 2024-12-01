const Razorpay = require('razorpay');
const crypto = require('crypto');
const Book = require("../books/book.model");
const { instance } = require("./config/razorpay");
const mongoose = require('mongoose');
const { createAOrderByData } = require("../orders/order.controller");
const Order = require('../orders/order.model');

exports.capturePayment = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: "Request body is empty. Please provide the required data." });
    }
    const { books, newOrder } = req.body;

    if (books.length === 0) {
        console.log("Please provide Book ID");
        return res.status(400).json({ success: false, message: "Please provide Book ID" });
    }
    let total_amount = 0;
    // Calculate total amount for the books
    for (const book_id of books) {
        let book;
        const validBookId = mongoose.Types.ObjectId.isValid(book_id) 
            ? new mongoose.Types.ObjectId(book_id) 
            : null;
        
        if (!validBookId) {
            console.log('Invalid Book ID');
            return res.status(400).json({ success: false, message: `Invalid Book ID: ${book_id}` });
        }
        try {
            book = await Book.findById(validBookId);
            if (!book) {
                console.log("Book not found");
                return res.status(404).json({ success: false, message: `Could not find the Book with ID: ${book_id}` });
            }
            total_amount += book.newPrice;
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    const receipt = crypto.randomBytes(10).toString("hex");
    const options = {
        amount: Math.round(total_amount * 100),
        currency: "INR",
        receipt: receipt,
        payment_capture: 1,
    };

    try {
        const order = await instance.orders.create(options);
        const create_order = new Order({
            ...newOrder,
            status: "Received",
            payment_status: "Initiated",
        });

        const result = await createAOrderByData(create_order);
        const orderId = result.order._id;
        return res.status(200).json({
            success: true,
            message: "Payment Initiated and order created successfully.",
            order: result,
            paymentOrder: order,
            orderId: orderId,
        });
    } catch (error) {
        console.log(error);
        const create_order = new Order({
            ...newOrder,
            status: "Payment Failed",
            payment_status: "Failed",
        });
        const result = await createAOrderByData(create_order);
        const orderId = result.order._id;
        return res.status(500).json({
            success: false,
            message: "Could not initiate payment order.",
            order: result,
            orderId: orderId,
        });
    }
};

exports.verifyPayment = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: "Request body is empty. Please provide the required data." });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, books, orderId } = req.body;
    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !books || !orderId) {
        return res.status(400).json({ success: false, message: "Payment verification failed: Missing required fields" });
    }
    // Verify the Razorpay signature
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const secret = process.env.RAZORPAY_SECRET;
    const expectedSignature = crypto.createHmac("sha256", secret)
                                      .update(body.toString())
                                      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                status: "Payment Failed",
                payment_status: "Failed",
            },
            { new: true }
        );
        return res.status(400).json({ success: false, message: "Payment verification failed: Invalid signature" });
    }
    // Signature matched, update the order status
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                status: "Processing",
                payment_status: "Completed",
            },
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: `Order with ID ${orderId} not found.`,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Payment verified and order updated successfully.",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Order update error:", error.message);
        return res.status(500).json({ success: false, message: error.message });

    }
};
