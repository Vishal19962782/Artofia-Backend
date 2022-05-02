const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Post = require("../models/post");
const fs = require("fs");
const User = require("../models/usermodel");
const { verify } = require("../route/jwt-middleware/verify");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");
const PostControllers = require("../controllers/PostControllers");
const { verifyArtist } = require("../route/jwt-middleware/verify");
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
router.post("/", verify, upload.single("image"), PostControllers.newPost);
router.get("/", verify, PostControllers.getPosts);
router.get("/getFollowing", verify, PostControllers.folowingPosts);
router.get("/find_by_id", verify, PostControllers.findUserById);
router.patch("/like", verify, PostControllers.like);
router.patch("/unlike", verify, PostControllers.unlike);
router.get("/test", async (req, res) => {
  const pr = await Post.find()
    .populate({
      path: "postLikes.userId",
      select: "_id fname lname",
    })
    .populate({
      path: "postComments.userId",
      select: "_id fname lname",
    })
    .populate("postOwner", "_id fname lname")
    .select("-_id");
  res.send(pr);
});
router.post("/comment", verify, PostControllers.comment);
router.put("/bid", verify, PostControllers.bid);
router.get("/getBids", verify, PostControllers.getBids);
router.get("/ArtistBids", verify, PostControllers.ArtistBids);
router.post("/AcceptBid", verify, PostControllers.acceptBids);
router.get("/getArtistImages", verify, PostControllers.getArtistImages);
module.exports = router;
