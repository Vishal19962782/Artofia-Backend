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
const TrendingRouteer = require("./route/TrendingRoutes");
const { redirect } = require("express/lib/response");
const cors = require("cors");
const EventRoutes = require("./route/EventRouters");
const paymentRoutes = require("./route/PaymentRoutes");
const TicketRoutes = require("./route/TicketRoutes");
const adminRoutes = require("./route/AdminRoutes");
const requestRoutes = require("./route/RequestRoutes");
const { log } = require("console");
require("dotenv").config();
app.use(cors());
app.use(methodOverride("_method"));
app.use(morgan("tiny"));
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
app.use("/route", router);
app.use("/api/user", Postrouter);
app.use("/admin", adminRouter);
app.use("/api/admin", adminRoutes);
app.use("/Event", EventRoutes);
app.use("/api/trending", TrendingRouteer);
app.use("/api/Events", EventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ticket", TicketRoutes);
app.use("/api/Request", requestRoutes);
app.use(express.static(path.join(__dirname, "/public")));
const DB = "mongodb://localhost:27017/blog";

mongoose
  .connect(DB)
  .then((message) => {
    console.log("db Connecetd good to go");
  })
  .catch((err) => {});

app.listen(process.env.PORT, () => {});

app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("route/homepage");
  } else {
    req.session.isLoggedIn = false;

    res.redirect("/route");
    // res.render("index",{err:"",succ:''});
  }
});
