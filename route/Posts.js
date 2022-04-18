const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Post = require("../models/post");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: "uploads",
  filename: function (req, file, cb) {
    // console.log("fiiiileeee"+JSON.stringify(file))
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
router.post("/", upload.single("image"), async (req, res) => {
  console.log(req.file);
  const postObj = {
    postName: req.body.postname,

    Image: {
      data: fs.readFileSync(
        path.join(__dirname, "..", "uploads", req.file.filename)
      ),
      contentType: "image/*",
    },
  };
  Post.create(postObj)
    .then((post) => {
      res.send(post);
    })
    .catch((err) => {
      console.log("error" + err);
      res.send(err);
    });
});
router.get("/", (req, res) => {
  Post.find()
    .then((post) => {
      res.send(post);
    }) 
    .catch((err) => {
      res.send(err);
    });
});
module.exports = router;
