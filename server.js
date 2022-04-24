const express = require("express");
const methodOverride = require("method-override");
const app = express();
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const Post = require("./models/post");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const User = require("./models/usermodel");
const Admin = require("./models/adminmodel");
const morgan = require("morgan");
const router = require("./route/userrouter");
const Postrouter = require("./route/Posts");
const adminRouter = require("./route/adminrrouter");
const { redirect } = require("express/lib/response");
const cors = require("cors");

require("dotenv").config();
app.use(cors());
app.use(methodOverride("_method"));
app.use(morgan("tiny"));
debugger;
app.use(function (req, res, next) {
  if (!req.user) {
    res.header(
      "Cache-Control",
      "private , no-cache, no-store, must-revalidate"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(fileUpload())

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  })
);
// app.use((req,res,next)=>{
//   res.locals.message=req.session.message;
//   delete req.session.message;
//   next();
// })
app.use("/route", router);
app.use("/api/user", Postrouter);
app.use("/admin", adminRouter);
app.set("view engine", "ejs");
app.use("/static", express.static(path.join(__dirname, "public")));
const DB = "mongodb://localhost:27017/blog";

mongoose
  .connect(DB)
  .then((message) => {
    console.log("connected to db");
  })
  .catch((err) => {});

app.listen(process.env.PORT, () => {
  console.log("server is running");
});

app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("route/homepage");
  } else {
    req.session.isLoggedIn = false;

    res.redirect("/route");
    // res.render("index",{err:"",succ:''});
  }
});
