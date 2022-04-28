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
router.get("/", (req, res) => {
  res.render("index", { err: "", succ: "" });
});
router.post(
  "/",
  check("email").isEmail().withMessage("Enter a valid email address"),
  async (req, res) => {
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
  }
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

  async (req, res) => {
    const { errors } = validationResult(req);
    debugger;
    const hashpass = await bcrypt
      .hash(req.body.password, 10)
      .then((message) => {
        return message;
      });
    if (!errors.length) {
      try {
        User.create({
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          password: hashpass,
          phoneNo: req.body.phoneNo,
          // avatar: req.file.path,
        }).then((messages) => {
          res.json("Success");
        });
      } catch (err) {
        console.log(err);
        if (err.code == 11000) {
          err.message = "User already exists";

          res.status(400).json({ message: "User already exists" });
        } else if (err) {
          res
            .status(400)
            .render("signup", { err: "Please enter valid details", errors });
        }
        // else {
        //   res.redirect("/route");
        // }
      }
    } else {
      res.status(400).render("signup", { err: "", errors });
    }
  }
);
router.put("/addAddress", verify, async (req, res) => {
  {
    const updated = await User.findByIdAndUpdate(
      req.headers.user,
      { $push: { addressArray: req.body } },
      { new: true }
    );
    if (updated) res.status(200).json(updated);
  }
});
// router.use("/homepage", (req, res, next) => {
//   if (!req.session.user) {
//
//     res.status(401).json({ message: "Not authenticated" });

//   } else {
//     next();
//   }
// });
router.get("/getUserInfo/:id", verify, (req, res) => {
  User.findById(req.params.id)
    .select("-password")
    .populate({
      path: "posts",
    })
    .then((user) => {
      console.log(user);
      res.status(200).json(user);
    });
});
router.get("/homepage", verify, async (req, res) => {
  if (req.headers.user) {
    const founduser = await User.findOne({ _id: req.headers.user }).lean();
    if (founduser) {
      res.status(200).json(founduser);
    }
  } else {
    res.status(404).json({ message: "User not found" });
  }
});
router.put("/updateUser", verify, async (req, res) => {
  console.log(req.headers.user);
  console.log(req.body);
  try {
    const newDetails = await User.findOneAndUpdate(
      { _id: req.headers.user },
      req.body,
      { new: true }
    );
    res.status(200).json(newDetails);
  } catch (err) {
    res.status(404).json({ message: "user not found" });
  }
});
router.get("/logout/", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(403).send("Error while logingout..!, Try again");
    } else {
      res.status(200).redirect("/");
    }
  });
});
router.post("/followUser/:id", verify, async (req, res) => {
  try {
    console.log("entered" + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log(id);
    const user = await User.updateOne(
      { _id: req.headers.user, following: { $nin: [id] } },
      { $push: { following: id } },
      { new: true }
    );
    if(user.matchedCount){
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
    res.status(200).json({message:"success"});
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "user not found" });
  }
});
module.exports = router;
