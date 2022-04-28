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
    currentBid: req.body.minPrice,
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
router.get("/getFollowing", verify, async (req, res) => {
  const id = mongoose.Types.ObjectId(req.headers.user);
  console.log(id);
  User.aggregate([
    { $match: { _id: id } },
    { $unwind: "$following" },
    {
      $lookup: {
        from: "User",
        localField: "following",
        foreignField: "_id",
        as: "following",
      },
    },
    { $unwind: "$following" },
    {
      $project: {
        posts: "$following.posts",
      },
    },
    { $unwind: "$posts" },
    {
      $lookup: {
        from: "Post",
        localField: "posts",
        foreignField: "_id",
        as: "posts",
      },
    },
  ]).then((user) => {
    console.log(user);
    res.json(user);
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
  const postId = mongoose.Types.ObjectId(req.body.postId);
  console.log(postId);
  console.log(req.body);
  const query = { _id: req.headers.user, "bids.postId": req.body.postId };
  try {
    const post = await Post.find(
      { _id: req.body.postId, "bids.userId": req.headers.user },
      async (err, post) => {
        console.log(
          "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
        );
        console.log(post);
        console.log(err);
        console.log(
          "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
        );

        if (!post.length) {
          console.log("newwwww bid");
          const post = await Post.findByIdAndUpdate(
            req.body.postId,
            {
              $push: {
                bids: { userId: req.headers.user, bidPrice: req.body.bid },
              },
              $set: { minPrice: req.body.bid },
            },
            { new: true }
          );
        } else {
          console.log("alreadyyyyy bidding");
          const post = await Post.findOneAndUpdate(
            { _id: req.body.postId, "bids.userId": req.headers.user },
            {
              $set: {
                "bids.$.bidPrice": req.body.bid,
                "bids.$.date": Date.now(),
                minPrice: req.body.bid,
              },
            },
            { new: true }
          );
        }
      }
    );

    // console.log(post);
    const user = User.find(
      { _id: req.headers.user, "bids.postId": req.body.postId },
      async (err, user) => {
        if (!user.length) {
          await User.findByIdAndUpdate(
            req.headers.user,
            {
              $push: { bids: { postId: req.body.postId, price: req.body.bid } },
            },
            { new: true }
          );
        } else {
          await User.findOneAndUpdate(
            query,
            {
              $set: {
                "bids.$.price": req.body.bid,
                "bids.$.date": Date.now(),
                "bids.$.postId": req.body.postId,
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    );
    console.log("Suucesss");
    res.status(200).send("Bid added");
  } catch (err) {
    console.log("EEEEEEEEEEEEEEEERRRRRRRRRRRRROOOOOOOOOOOOORRRRRRRRRRRRR");
    // console.log(err);
    res.status(400).send(err);
  }
});
router.get("/getBids", verify, (req, res) => {
  const selectCondition = `bids Notification`;
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
  console.log("ACCCCCCCCCCCCCEEEEEEEEEPTING");
  try {
    const notification = `You're bid for ${req.body.postName}  has been accepted`;
    const foundPost = await Post.findOne({ _id: req.body.postId }).select(
      "Status"
    );
    console.log(foundPost.Status != "Accepted");
    if (foundPost.Status != "Accepted") {
      const post = await Post.findByIdAndUpdate(
        req.body.postId,
        { $set: { Status: "Accepted", soldTo: req.body.userId } },
        { new: false }
      );
      console.log("+++++++++++++++++++++++++++++++++++");
      console.log(post);
      console.log("+++++++++++++++++++++++++++++++++++");
      if (1) {
        console.log(req.body);
        console.log("+++++++++++++++==");
        console.log(req.headers.user);
        console.log("---------------");
        const user = await User.updateOne(
          { _id: req.body.userId, "bids.postId": req.body.postId },
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
            $set: { "bids.$.Status": "Accepted" },
          },
          { new: true }
        );
        console.log(post);
        console.log("UUUUUUUUUUser");
        console.log(user);
      }
      res.status(200).send("Bid Accepted");
    } else {
      throw new Error({
        err: "This bid has already been accepted",
        Status: foundPost.Status,
      });
    }
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
router.get("/getArtistImages", verify, (req, res) => {
  Post.find({ postOwner: req.body.user })
    .select("Image")
    .then((post) => {
      console.table(post);
      res.send(post);
    })
    .catch((err) => {
      res.send(err);
    });
});
module.exports = router;
