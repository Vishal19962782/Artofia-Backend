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
    minPrice: req.body.minPrice,
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
      console.log(err);
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
    .populate("postOwner", "_id fname lname avatar")
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
    .populate("postOwner", "_id fname lname")
    .select("-_id");
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

router.put("/bid", verify, async (req, res) => {
  // bid checking if value is greater than max value in bids array
  console.log(req.body);
  try {
    await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { bids: { userId: req.headers.user, bidPrice: req.body.bid } } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.headers.user,
      { $push: { bids: { postId: req.body.postId, price: req.body.bid } } },
      { new: true }
    );
    res.status(200).send("Bid added");
  } catch (err) {
    res.status.send(err);
  }
});
router.get("/getBids", verify, (req, res) => {
  const selectCondition = `bids`;
  User.findById(req.headers.user)
    .populate("bids.postId")
    .select(selectCondition)
    .where("bids")
    .elemMatch({ userId: req.headers.user })
    .then((user) => {
      console.log(user);
      res.send(user);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});
router.get("/ArtistBids", verify, (req, res) => {
  console.log("keeri");
  Post.find({ postOwner: req.headers.user })
    .then((post) => {
      console.table(post);
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
router.post("/AcceptBid", verify, async (req, res) => {
  try {
    const notification = `You're bid for ${req.body.postName}  has been accepted`;
    
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      { $set: { Status: "Accepted",soldTo:req.body.userId } },
      {new:false}
    );
    console.log("+++++++++++++++++++++++++++++++++++");
    console.log(post);
    console.log("+++++++++++++++++++++++++++++++++++");
    if (1) {
      
      const user = await User.updateOne(
        { _id: req.body.userId },
        {
          $push: {
            Notification: {
              postId: req.body.postId,
              userId: req.headers.user,
              price: req.body.price,
              status: "Accepted",
              notification: notification,
            },
          },
        },
        { new: true }
      );
      console.log(post);
      console.log(user);

      res.status(200).send("Bid Accepted");
    }
    else{
      throw new Error("Post is not in bidding status");
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
module.exports = router;
