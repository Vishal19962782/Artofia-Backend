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

exports.newPost= async (req, res) => {
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
  }
exports.getPosts=(req, res) => {
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
  }
exports.folowingPosts=async (req, res) => {
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
  }
exports.findUserById=(req, res) => {
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
  }
exports.like= async (req, res) => {
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
  }
exports.unlike=  async (req, res) => {
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
  }
exports.comment=async (req, res) => {
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
  }
exports.bid= async (req, res) => {
    // bid checking if value is greater than max value in bids array
    const postId = mongoose.Types.ObjectId(req.body.postId);
    console.log(postId);
    console.log(req.body);
    const query = { _id: req.headers.user, "bids.postId": req.body.postId };
    try {
      const post = await Post.find(
        { _id: req.body.postId, "bids.userId": req.headers.user },
        async (err, post) => {
        
  
          if (!post.length) {
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
      ).clone()
  
      // console.log(post);
      const user =await  User.find(
        { _id: req.headers.user, "bids.postId": req.body.postId },
        async (err, user) => {
            console.log("++++++++++++((((((((((((((++++++++++++");
            console.log(user);
            console.log("++++++++++))))))))))))))))))))++++++++++++++++");
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
      )
      console.log("Suucesss");
      res.status(200).send("Bid added");
    } catch (err) {
      console.log("EEEEEEEEEEEEEEEERRRRRRRRRRRRROOOOOOOOOOOOORRRRRRRRRRRRR");
      console.log(err);
      res.status(400).send(err);
    }
  }
exports.getBids=  (req, res) => {
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
  }
exports.ArtistBids= (req, res) => {
    Post.find({ postOwner: req.headers.user })
      .then((post) => {
        console.table(post);
        res.send(post);
      })
      .catch((err) => {
        res.send(err);
      });
  }
exports.acceptBids=async (req, res) => {
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
  }
exports.getArtistImages=(req, res) => {
    Post.find({ postOwner: req.body.user })
      .select("Image")
      .then((post) => {
        console.table(post);
        res.send(post);
      })
      .catch((err) => {
        res.send(err);
      });
  }