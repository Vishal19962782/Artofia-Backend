const express = require("express");
const session = require("express-session");
const { append, redirect } = require("express/lib/response");
const res = require("express/lib/response");
const router = express.Router();
const User = require("../models/usermodel");
const { check, validationResult } = require("express-validator");
const ratelimiter=require("express-rate-limit");
var multer = require('multer');
const user = new User();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const limiter=ratelimiter({windowMS:2000,max:5});

router.post("/",check('mail').isEmail().withMessage("Enter a valid email address"), async (req, res) => {
  const {errors}=validationResult(req)
  console.log(errors)
  const { mail, password } = req.body;
  const user = await User.findOne({
    email: new RegExp("^" + mail.toLowerCase(), "i"),
  }).lean();
  if(errors.length==0)
{
  if (!user) {
    res.status(401).render("index", { err: "User not found" ,succ:''});
  } else {
    if(user.isBlocked){
      res.status(403).render("index", { err: "User is blocked please contact admin" ,succ:''});
    }
    else if((!user.isBlocked) &&(await bcrypt.compare(password, user.password))) {
      req.session.user = user.email;
      req.session.usertype = "user";
      res.status(200).redirect("homepage");
    } else {
      res.status(401).render("index", { err: "Wrong username or password", succ: "" });
    }
  }}
  else{
    res.status(401).render("index", { err: "Invalid Email Address",succ:'' });
  }
});
debugger
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
  check("mail").isEmail().withMessage("Email is invalid"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),limiter,
  async (req, res) => {

    const { errors } = validationResult(req);
    debugger
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
          email: req.body.mail,
          password: hashpass,
        }).then((message) => {
          res.status(201).render("index", { succ: "User created", err: "" });
     
        });
      } catch (err) {
        console.log(err);
        if (err.code == 11000) {
          console.log(JSON.stringify(err));
          console.log(err);
          err.message = "User already exists";
          res.status(409).render("signup", {
            err: "User already exst with this email_ID",
            succ: "",
            errors: 0,
          });
        } else if (err) {
          res.status(400).render("signup", { err: "Please enter valid details", errors });
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
router.use("/homepage", (req, res, next) => {
  if (!req.session.user) {
    console.log("User");
    res.status(401).redirect("/");
  } else {
    next();
  }
});
router.get("/homepage", async (req, res) => {
  if (req.session.user) {
    const founduser = await User.findOne({ email: req.session.user }).lean();
    if (founduser) {
      res.status(200).render("Homepage", { founduser });
    }
  } else {
    res.status(404).redirect("/");
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
