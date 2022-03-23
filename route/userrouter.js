const express = require("express");
const session = require("express-session");
const { append, redirect } = require("express/lib/response");
const res = require("express/lib/response");
const router = express.Router();
const User = require("../models/usermodel");
const { check, validationResult } = require("express-validator");
var multer = require('multer');
const user = new User();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { mail, password } = req.body;
  const user = await User.findOne({
    email: new RegExp("^" + mail.toLowerCase(), "i"),
  }).lean();

  if (!user) {
    res.status(400).render("index", { err: "User not found" ,succ:''});
  } else {
    if(user.isBlocked){
      res.status(400).render("index", { err: "User is blocked please contact admin" ,succ:''});
    }
    else if((!user.isBlocked) &&(await bcrypt.compare(password, user.password))) {
      req.session.user = user.email;
      req.session.usertype = "user";
      res.redirect("homepage");
    } else {
      res.render("index", { err: "Wrong username or password", succ: "" });
    }
  }
});
debugger
// router.get('/',(req,res)=>{
//   res.render("index", { err: "", succ: "" });
// })
router.get("/register", (req, res) => {
  res.render("signup", { err: "", succ: "", errors: 0 });
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
    .withMessage("Password must be at least 8 characters long"),
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
          res.render("index", { succ: "User created", err: "" });
     
        });
      } catch (err) {
        console.log(err);
        if (err.code == 11000) {
          console.log(JSON.stringify(err));
          console.log(err);
          err.message = "User already exists";
          res.render("signup", {
            err: "User already exst with this email_ID",
            succ: "",
            errors: 0,
          });
        } else if (err) {
          res.render("signup", { err: "Please enter valid details", errors });
        } else {
          res.redirect("/route");
        }
      }
    } else {
      console.log(errors);
      res.render("signup", { err: "", errors });
    }
  }
);
router.use("/homepage", (req, res, next) => {
  if (!req.session.user) {
    console.log("User");
    res.redirect("/");
  } else {
    next();
  }
});
router.get("/homepage", async (req, res) => {
  if (req.session.user) {
    const founduser = await User.findOne({ email: req.session.user }).lean();
    if (founduser) {
      res.render("Homepage", { founduser });
    }
  } else {
    res.redirect("/");
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("err");
    } else {
      res.redirect("/");
    }
  });
});

module.exports = router;
