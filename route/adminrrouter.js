const express = require("express");
const adminrouter = express.Router();
const Admin = require("../models/adminmodel");
const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const { escapeRegExpChars } = require("ejs/lib/utils");
const { check, validationResult } = require("express-validator");
const session = require("express-session");
const { append } = require("express/lib/response");
const functions=require("./function");
const { findByIdAndUpdate, findByIdAndDelete } = require("../models/usermodel");
const req = require("express/lib/request");

adminrouter.get("/", (req, res) => {
  console.log("root");
  if (req.session.usertype == "admin") {
    res.redirect("admin/homepage");
  } else {
    res.render("adminlogin",{err:""});
  }
});

adminrouter.post("/", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  const user = await Admin.findOne({ email: username }).lean();
  if (!user) {
    res.send("User not found");
  } else {
    if (password == user.password) {
      req.session.Isadmin = username;
      req.session.usertype = "admin";
      res.redirect("homepage");
    } else {
      res.render("adminlogin", { err: "Wrong username or password" });
    }
  }
});
adminrouter.use((req, res, next) => {
  if (!req.session.Isadmin) {
    console.log("not admin");
    console.log("User");
    res.redirect("/admin");
  } else next();
});
adminrouter.get("/add-user", (req, res) => {
  console.log("kaaka malannu")
  res.render("admincreate",{err:"",errors:0});
});
adminrouter.post("/add-user",check("fname")
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
 const {errors}=validationResult(req);
  const { fname, lname, mail, password } = req.body;
  const hashpass = await bcrypt.hash(password, 10).then((message) => {
    return message;
  } );
  if (!errors.length) {
    try {
      await User.create({
        fname: fname,
        lname: lname,
        email: mail,
        password: hashpass,
      }).then((message) => {
        res.redirect("/admin/homepage");
      });
    } catch (err) {
      console.log(err);
      if (err.code == 11000) {
        console.log(JSON.stringify(err));
        console.log(err);
        err.message = "User already exists";
        res.render("admincreate", {
          err: "User already exst with this email_ID",
          succ: "",
          errors: 0,
        });
      } else if (err) {
        res.render("admincreate",{ err: "Please enter valid details", errors });
      } else {
        res.redirect("/route");
      }
    }
  } 
  else {
    console.log(errors);
    res.render("admincreate", { err: "", errors });
  }
})
adminrouter.get("/homepage", async (req, res) => {
  if (req.session.usertype == "admin") {
    await User.find({}).sort({fname:1}) .collation({locale: "en" }).then((userobj) => {
      res.render("adminhome", { userobj });
    });
  } else {
    res.redirect("/admin");
  }
});
adminrouter.get('/find',async (req,res)=>{
  console.log(req.query.iofield)
  const userobj = await User.find({ fname: new RegExp(req.query.iofield, "i") }).lean();
  console.log(userobj[0]);
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  res.render("searchpage", { userobj });

})
adminrouter.get("/:id",async(req, res)=>{
  const user = await User.findOne({ _id: req.params.id })
  .then((message) => {
    res.render("adminupdate", { message });
  })
  .catch((err) => {
    res.send(err);
  });
})
adminrouter.put("/:id",async(req, res)=>{
  const {fname,lname,mail}=req.body;
  try {
    await User.updateOne({_id:req.params.id},{fname:fname,lname:lname,email:mail})
    .then((message) => {
      res.redirect("/admin/homepage");
    })
  }catch(err){
    console.log(err.code);
    if(err.code==11000){
     err.message="User already exists";
    }
    res.render("adminupdate",{err});
  }
})
adminrouter.delete("/:id",async(req, res)=>{
  await User.findByIdAndDelete(req.params.id)
  res.redirect('/admin')
// const user=await User.findOne({_id:req.params.id});
//   try
// {  if(user.isBlocked){
//     await User.updateOne({_id:req.params.id},{isBlocked:false})
//     .then((message) => {
//       res.redirect("/admin/homepage");
//     })
//   }else{  
//     await User.updateOne({_id:req.params.id},{isBlocked:true})
//     .then((message) => {
//       res.redirect("/admin/homepage");
//     })
//   }}
//   catch(error){
//     res.send(err)
//   }
})

module.exports = adminrouter;
