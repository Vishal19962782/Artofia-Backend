const express = require("express");
const session = require("express-session");
const { append, redirect, render, json } = require("express/lib/response");
const res = require("express/lib/response");
const router = express.Router();
const User = require("../models/usermodel");
const { check, validationResult } = require("express-validator");
const ratelimiter = require("express-rate-limit");
const user = new User();
const bcrypt = require("bcrypt");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotalySecretKey");
const jwt = require("jsonwebtoken");
const { verify } = require("../route/jwt-middleware/verify");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");
const multer = require("multer");
const UserControllers = require("../controllers/UserControllers");
const TicketRoute = require("../route/TicketRoutes");
const otp = require("otp-generator");
const client = require("../Sms helpers/twilio");

cloudinary.config({
  cloud_name: "artofia",
  api_key: "174827452135129",
  api_secret: "UgvcCdQ00yUFI9FQ2FgAg5UumqQ",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "DEV",
  },
});
const upload = multer({ storage: storage });
router.get("/", UserControllers.get);
router.post(
  "/",
  check("email").isEmail().withMessage("Enter a valid email address"),
  UserControllers.login
);
debugger;
router.get("/register", (req, res) => {
  res.status(200).render("signup", { err: "", succ: "", errors: 0 });
});
router.post(
  "/register",
  upload.single("image"),
  check("fname")
    .isLength({ min: 3 })
    .withMessage("First name must be at least 3 characters long"),
  check("lname")
    .isLength({ min: 3 })
    .withMessage("Last name must be at least 3 characters long"),
  check("email").isEmail().withMessage("Email is invalid"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  UserControllers.register
);
router.put("/addAddress", verify, UserControllers.addAddress);
router.get("/getUserInfo/:id", verify, UserControllers.getUserInfo);
router.get("/homepage", verify, UserControllers.homepage);
router.put("/updateUser", verify, UserControllers.updateUser);
router.get("/logout/", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(403).send("Error while logingout..!, Try again");
    } else {
      res.status(200).redirect("/");
    }
  });
});
router.post("/followUser/:id", verify, UserControllers.followUser);
router.post("/getOtp", async (req, res) => {
  if (req.body.email) {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    req.body.phoneNo = user.phoneNo;
    if (!user) {
      res.status(200).json({ message: "invalid email" });
    } else {
      const token = jwt.sign(
        { phoneNo: req.body.phoneNo, userId: user._id },
        "secretOtpkey",
        {
          expiresIn: "1h",
        }
      );
      console.log(req.body.phoneNo);
      client.verify
        .services("VA6f10262fa4d3768012aca96083227c56")
        .verifications.create({ to: req.body.phoneNo, channel: "sms" })
        .then((verify) => res.status(200).send(token))
        .catch((err) => {
          console.log(err);
        });
    }
  }
});
router.post("/verifyOtp", async (req, res) => {
  console.log(req.body.otp);
  const number = jwt.verify(req.body.token, "secretOtpkey", (err, decoded) => {
    if (err) {
      res.status(200).json({ message: "invalid otp" });
    } else {
      return decoded;
    }
  });
  client.verify
    .services("VA6f10262fa4d3768012aca96083227c56")
    .verificationChecks.create({ to: number.phoneNo, code: req.body.otp })
    .then((verification_check) => {
      if (verification_check.status !== "approved") {
        throw new Error("invalid otp");
      }
      const token = jwt.sign(
        { phoneNo: number, userId: number.userId },
        "secretOtpkey",
        { expiresIn: "1h" }
      );
      res.status(200).send(token);
    })
    .catch(() => {
      res.status(400).json({ message: "invalid otp" });
    });
});
router.put("/changePassword", async (req, res) => {
  console.log(req.body.password);
  const hashpass = await bcrypt.hash(req.body.password, 10).then((message) => {
    return message;
  });
  console.log(hashpass);
  jwt.verify(req.body.token, "secretOtpkey", (err, decoded) => {
    if (err) {
      console.log(err);
      res.status(200).json({ message: "invalid otp" });
    } else {
      console.log(decoded.phoneNo);
      const user = User.findByIdAndUpdate(decoded.phoneNo.userId, {
        password: hashpass,
      }).then((user) => {
        res.status(200).json({ message: "password changed successfully" });
      });
    }
  });
});
router.put("/userPasswordChnage",verify,async (req,res)=>{
  console.log(req.body.password);
  const hashpass = await bcrypt.hash(req.body.password, 10)
  user.findByIdAndUpdate(req.headers.user,{password:hashpass}).then((user)=>{
    res.status(200).json({message:"password changed successfully"})
  })
})
module.exports = router;
