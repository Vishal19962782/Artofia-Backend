const Post = require("../models/post");
const User = require("../models/usermodel");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const Cryptr = require("cryptr");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const router = require("../route/Posts");
const message = require("../route/Sms Middleware/sms");
const otp = require("otp-generator");
const client = require("../Sms helpers/twilio"); //twilio client
exports.get = (req, res) => {
  res.send("working");
};
exports.login = async (req, res) => {
  const { errors } = validationResult(req);

  const { email, password } = req.body;
  const user = await User.findOne({
    email: new RegExp("^" + email.toLowerCase(), "i"),
  }).lean();
  if (errors.length == 0) {
    if (!user) {
      res.status(401).json({ message: "No account found" });
    } else {
      if (user.isBlocked) {
        res.status(403).json({ message: "User blocked by admin" });
      } else if (
        !user.isBlocked &&
        (await bcrypt.compare(password, user.password))
      ) {
        const accesstoken = jwt.sign(
          {
            id: user._id,
            email: user.email,
            isArtist: user.isArtist,
            isAdmin: user.isAdmin,
          },
          "secretkey"
        );
        req.session.user = user.email;
        req.session.usertype = "user";
        res.status(200).json({ id: user._id, token: accesstoken });
      } else {
        res.status(401).json({ message: "invalid username or password" });
      }
    }
  } else {
    res.status(401).json({ message: "Invalid Email Address", succ: "" });
  }
};
exports.register = async (req, res) => {
  const { errors } = validationResult(req);
  const hashpass = await bcrypt.hash(req.body.password, 10).then((message) => {
    return message;
  });
  console.log(req.body);
  if (!errors.length) {
    try {
      // const result = await client.verify
      //   .services("VA6f10262fa4d3768012aca96083227c56")
      //   .verificationChecks.create({ to: req.body.phoneNo, code: req.body.Otp })
      //   .then((verification_check) => {
      //     return verification_check.status;
      //   });
      // console.log(result);
      // if (result != "approved") {
      //   throw new Error("OTP not verified");
      // }

      await User.create({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: hashpass,
        phoneNo: req.body.phoneNo,
        avatar: req?.file?.path,
      }).then((messages) => {
        res.json("Success");
      });
    } catch (err) {
      console.log("EEEEEEEEEEEEEEEEEEEEERORRR");
      console.log(err);
      if (err.code == 11000) {
        res.status(200).send({ message: "User already exists", code: 300 });
      } else {
        res.status(200).send({ message: "Invalid OTP", code: 304 });
      }
      // else {
      //   res.redirect("/route");
      // }
    }
  }
};
exports.addAddress = async (req, res) => {
  {
    const updated = await User.findByIdAndUpdate(
      req.headers.user,
      { $push: { addressArray: req.body } },
      { new: true }
    );
    if (updated) res.status(200).json(updated);
  }
};
exports.getUserInfo = (req, res) => {
  User.findById(req.params.id)
    .select("-password")
    .populate({
      path: "posts",
    })
    .then((user) => {
      console.log(user);
      res.status(200).json(user);
    });
};
exports.homepage = async (req, res) => {
  if (req.headers.user) {
    const founduser = await User.findOne({ _id: req.headers.user }).lean();
    if (founduser) {
      res.status(200).json(founduser);
    }
  } else {
    res.status(404).json({ message: "User not found" });
  }
};
exports.updateUser = async (req, res) => {
  console.log(req.headers.user);
  console.log(req.body);
  const hashpass = await bcrypt.hash(req.body.password, 10);
  console.log(hashpass);
  try {
    const newDetails = await User.findOneAndUpdate(
      { _id: req.headers.user },
      { ...req.body, password: hashpass },
      { new: true }
    );
    res.status(200).json(newDetails);
  } catch (err) {
    res.status(404).json({ message: "user not found" });
  }
};
exports.followUser = async (req, res) => {
  try {
    console.log("entered" + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log(id);
    const user = await User.updateOne(
      { _id: req.headers.user, following: { $nin: [id] } },
      { $push: { following: id } },
      { new: true }
    );
    if (user.matchedCount) {
      const user2 = await User.updateOne(
        { _id: id, followers: { $nin: [req.headers.user] } },
        { $push: { followers: req.headers.user } },
        { new: true }
      );
    }
    if (!user.matchedCount) {
      const unfollow = await User.updateOne(
        { _id: req.headers.user, following: { $in: [id] } },
        { $pull: { following: id } },
        { new: true }
      );
      const unfollow2 = await User.updateOne(
        { _id: id, followers: { $in: [req.headers.user] } },
        { $pull: { followers: req.headers.user } },
        { new: true }
      );
      console.log("unfollowed" + JSON.stringify(unfollow));
    }
    const updatedUser = await User.findById(req.headers.user);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "user not found" });
  }
};
