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
router.post("/", verify, upload.single("image"), async (req, res) => {
  const postObj = {
    postName: req.body.postName,
    postOwner: req.headers.user,
    postDescription: req.body.postDescription,
    Image: req.file.path,
  };
  Post.create(postObj)
    .then((post) => {
      User.findByIdAndUpdate(
        post.postOwner,
        { $push: { posts: post._id } },
        { new: true },
        (err, user) => {},
        {
          new: true,
        }
      );

      res.status("200").json(post);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});
router.get("/", verify, (req, res) => {
  Post.find()
    .populate({
      path: "postLikes.userId",
      select: "_id fname lname",
    })
    .populate({
      path: "postComments.userId",
      select: "_id fname lname ",
    })
    .populate("postOwner", "_id fname lname")
    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.get("/find_by_id", verify, (req, res) => {
  Post.findById(req.query.postId)
    .populate({
      path: "postLikes.userId",
      select: "_id fname lname",
    })
    .populate({
      path: "postComments.userId",
      select: "_id fname lname",
    })
    .populate("postOwner", "_id fname lname")
    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.patch("/like", verify, async (req, res) => {
  const post = await Post.findById(req.body.postId);

  Post.updateOne(
    { _id: post._id },
    { $push: { postLikes: { userId: req.headers.user } } }
  )

    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.patch("/unlike", verify, async (req, res) => {
  const post = await Post.findById(req.body.postId);
  Post.updateOne(
    { _id: post._id },
    { $pull: { postLikes: { userId: req.headers.user } } }
  )
    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
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
    .populate("postOwner", "_id fname lname");
  res.send(pr);
});
router.post("/comment", verify, async (req, res) => {
  const post = await Post.findById(req.body.postId);
  Post.findByIdAndUpdate(
    post._id,
    {
      $push: {
        postComments: { userId: req.headers.user, comment: req.body.comment },
      },
    },
    { new: true }
  )
    .populate({
      path: "postComments.userId",
      select: "_id fname lname",
    })
    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
module.exports = router;
