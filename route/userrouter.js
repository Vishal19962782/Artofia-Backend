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
module.exports = router;
