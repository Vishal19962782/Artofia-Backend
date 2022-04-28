const express = require("express");
const router = express.Router();
const User = require("../models/usermodel");
const Post = require("../models/post");

router.get("/", (req, res) => {
  console.log("ksjdhfad");
  Post.aggregate([
    {
      $project: {
        count: { $size: "$postLikes" },
        postOwner: 1,
        img: "$Image",
        name: "$postName",
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    // { $lookup: { from: "User", localField: "_id", foreignField: "Ima" } },
  ])
    .then((data) => {
      console.log(data);
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    });
});
router.get("/trendingArtsits", (req, res) => {
  User.aggregate([{
    $match: {isArtist: true},
  },
    { 
      $project: {
        count: { $sum: { $size: "$followers", $size: "$posts" } },
        postOwner: 1,
        img: "$Image",
        name: "$fname",
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ])
    .then((data) => {
      console.log(data);
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
