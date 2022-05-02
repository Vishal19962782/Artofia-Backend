const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/usermodel");
const razorpay = require("razorpay");
const TicketOrders = require("../models/TicketOrder");
const { verify } = require("../route/jwt-middleware/verify");
const Events = require("../models/Events");


const instance = new razorpay({
  key_id: "rzp_test_gVMs3K2VHziBgg",
  key_secret: "En9MCIqEhetQB0KmlpSJsBHy",
});


router.get("/getRazorpayKey", (req, res) => {
  res.status(200).send(instance.key_id);
});
router.post("/order", verify, (req, res) => {
  instance.orders
    .create({
      amount: req.body.amount,
      currency: "INR",
    })
    .then((response) => {
      console.log(response);
      res.send(response);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.post("/payOrder", verify, async (req, res) => {
  console.log(req.body);
  try {
    const { amount, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;
    const newOrder =TicketOrders({
      isPaid: true,
      amount: amount,
      razorpay: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      },
      orderOwner: req.headers.user,
      orderItem: req.body.orderItem,
      noOfTickets: req.body.noOfTickets,
      itemType: "Event",
    });
    const order = await newOrder.save();
    console.log("++++++++++++++++++++++++++++");
    console.log(order);
    console.log("++++++++++++++++++++++++++++");
    const user = await User.findOneAndUpdate(
      { _id: req.headers.user },
      { $push: { tickets: order._id } }
    );     
    const event = await Events.findByIdAndUpdate(req.body.orderItem, {
      $inc: { noOfTicketsSold: req.body.noOfTickets },
      $push: { tickets: order._id },
    });

    console.log();
    res.send("Success");
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});
module.exports = router;
