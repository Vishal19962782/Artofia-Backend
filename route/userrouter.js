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

const verify = (req, res, next) => {
  const authheader = req.headers.accesstoken;

  if (authheader) {
    console.log("++++++++++++"+authheader);
    const token = authheader.split(" ")[1];
    console.log(JSON.parse(token));
    jwt.verify(JSON.parse(token), "secretkey", (err, user) => {
      console.log(err + user);
      if (err) return res.status(403).json("token not valid");
      else req.user = user;
      next();
    }); 
  } else {
    res.status(400).json({ message: "Not authenticated" });
  }
};

router.get("/", (req, res) => {
  res.render("index", { err: "", succ: "" });
});
router.post(
  "/",
  check("email").isEmail().withMessage("Enter a valid email address"),
  async (req, res) => {
    console.log(req.body);
    const { errors } = validationResult(req);
    console.log(errors);
    const { email, password } = req.body;
    const user = await User.findOne({
      email: new RegExp("^" + email.toLowerCase(), "i"),
    }).lean();
    if (errors.length == 0) {
      if (!user) {
        res.status(401).json({ message: "No account found" });
      } else {
        if (user.isBlocked) { 
          console.log("blocked");
          res.status(403).json({ message: "User blocked by admin" });
        } else if (
          !user.isBlocked && 
          (await bcrypt.compare(password, user.password))
        ) {
          const accesstoken = jwt.sign(
            { id: user._id, email: user.email },
            "secretkey"
          );
          req.session.user = user.email;
          req.session.usertype = "user";
          res.status(200).json({id:user._id,token:accesstoken});
        } else {
          console.log("invalid creds");
          res.status(401).json({ message: "invalid username or password" });
        }
      }
    } else {
      res
        .status(401)
        .json({ message: "Invalid Email Address", succ: "" });
    }
  }
);
debugger; 
router.get("/register", (req, res) => {
  res.status(200).render("signup", { err: "", succ: "", errors: 0 });
});
router.post(
  "/register",
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
        await User.create({
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          password: hashpass,
          phoneNo: req.body.phoneNo
        }).then((messages) => {
          console.log("success");
          res.json("Success");
           
        });
      } catch (err) {
        console.log(err);
        if (err.code == 11000) {
          console.log(JSON.stringify(err));
          console.log(err);
          err.message = "User already exists";
          console.log(req.body);
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
      console.log(errors);
      res.status(400).render("signup", { err: "", errors });
    }
  }
);
// router.use("/homepage", (req, res, next) => {
//   if (!req.session.user) {
//     console.log("User");
//     res.status(401).json({ message: "Not authenticated" });
  
//   } else {
//     next();
//   }
// });
router.get("/homepage",verify,async (req, res) => {
  console.log(req.headers.user);
  if (req.headers.user) {
    const founduser = await User.findOne({ _id:req.headers.user }).lean();
    if (founduser) {
      res.status(200).json(founduser );
    }
  } else {
    console.log("User not found");
    res.status(404).json({ message: "User not found" });
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(403).send("Error while logingout..!, Try again");
    } else {
      res.status(200).redirect("/");
    }
  });
});

module.exports = router;
