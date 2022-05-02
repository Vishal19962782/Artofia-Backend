const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verify } = require("../route/jwt-middleware/verify");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");
const EventControllers = require("../controllers/EventControllers");
cloudinary.config({
  cloud_name: "artofia",
  api_key: "174827452135129",
  api_secret: "UgvcCdQ00yUFI9FQ2FgAg5UumqQ",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "EVENTS",
  },
});

const upload = multer({ storage: storage });
router.post("/AddEvent",verify,upload.single("image"), EventControllers.AddEvent);
router.get("/getEvents", EventControllers.getEvents);
module.exports = router;
