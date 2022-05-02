const razorpay = require("razorpay");
const express = require("express");
const router = express.Router();
const { verify } = require("../route/jwt-middleware/verify");
const Order = require("../models/orders");
const User = require("../models/usermodel");
const Post = require("../models/post");
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
  try {
    const { amount, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;
    const newOrder = Order({
      isPaid: true,
      amount: amount,
      razorpay: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      },
      orderOwner: req.headers.user,
      orderItem: req.body.orderItem,
      itemType: req.body.itemType,
    });
    const order = await newOrder.save();
    console.log("++++++++++++++++++++++++++++");
    console.log(order);
    console.log("++++++++++++++++++++++++++++");
    const user = await User.findOneAndUpdate(
      { _id: req.headers.user, "bids.postId": req.body.orderItem },
      { $push: { orders: order._id }, $set: { "bids.$.Status": "Sold" },$pull:{Notification:{postId:req.body.orderItem}} }
    );
    const post = await Post.findOneAndUpdate(
      { _id: req.body.orderItem },
      { $set: { Status: "Sold", saleId: order._id } }
    );
    console.log();
    res.send("Success");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
module.exports = router;