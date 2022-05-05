const express = require("express");
const { find } = require("../models/usermodel");
const adminrouter = express.Router();
const User = require("../models/usermodel");
const Post = require("../models/post");

// app.use("/api/admin",adminRoutes)

adminrouter.get("/getUserInfos", async (req, res) => {
  try {
    const user = await User.find().select("-password ");
    res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
adminrouter.put("/blockUser", async (req, res) => {
  const user = await User.findById(req.body.id).select("isBlocked");
  if (user.isBlocked) {
    await User.updateOne({ _id: req.body.id }, { isBlocked: false });
    res.send("false");
  } else {
    await User.updateOne({ _id: req.body.id }, { isBlocked: true });
    res.send("true");
  }
});
adminrouter.get("/getPostInfos", async (req, res) => {
  try {
    const post = await Post.find()
      .select("-postDescription -createdAt -updatedAt -__v")
      .populate("postOwner", "fname lname avatar");
    res.send(post);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
adminrouter.get("/getUserInfo/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});
module.exports = adminrouter;