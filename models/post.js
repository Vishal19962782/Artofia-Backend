const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const postSchema = new mongoose.Schema(
  {
    postName: {
      type: String,
      required: [true, "This field is compulsory"],
      index: { unique: false },
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, "Enter a valid name"],
      minlength: [3, "please enter min 5 chars"],
    },
    postDescription: {
      type: String,
      required: false,
      index: { unique: false },
    },
    Image: { data: Buffer,contentType:String},
    postDate: { type: Date, required: false, index: { unique: false } },
    // postLikes: [
    //   {
    //     userId: { type: String, required: false, index: { unique: false } },
    //     userName: { type: String, required: false, index: { unique: false } },
    //   },
    // ],
    // postComments: [
    //   {
    //     userId: { type: String, required: false, index: { unique: true } },
    //     userName: { type: String, required: false, index: { unique: false } },
    //     userAvatar: { type: String, required: false, index: { unique: false } },
    //     comment: { type: String, required: false, index: { unique: false } },
    //   },
    // ],
  },
  { collection: "Posts" }
);

const Post = mongoose.model("Posts", postSchema);
module.exports = Post;
