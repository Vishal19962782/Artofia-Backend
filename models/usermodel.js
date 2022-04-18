const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userScema = new mongoose.Schema(
  {
    fname: { type: String,
       required:[ true,"This field is compulsory"],
        index: { unique: false },
        match:[/^[a-zA-Z][a-zA-Z\s]*$/,"Enter a valid name"] ,
        minlength:[3,"please enter min 5 chars"],
      },
    lname: { type: String, required: false, index: { unique: false } ,match:[/^[a-zA-Z][a-zA-Z\s]*$/,"Enter a valid name"]},

    email: { type: String, required: true, index: { unique:true } },
    password: { type: String, required: true,minlength:[3,"Please enter a passowrd of atleast 5 chars"] },
    isBlocked: { type: Boolean, default: false },
    address: { type: String, required: false, index: { unique: false } },
    phoneNo: { type: String, required: true, index: { unique: false } },
    avatar: { type: String, required: false, index: { unique: false } },
    role: { type: String, required: false, index: { unique: false } },
    isArtist: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    followers: [{userName:String,userId:String}],
    following: [{userName:String,userId:String}],
    posts: [{postId:String,postName:String}], 
    orders: [{orderId:String,orderName:String}],
    tickets: [{ticketId:String,ticketName:String}],
    Notifications: [{NotificationId:String,NotificationName:String}],
    bids:[{postId:String,postName:String,date:Date,price:String}],
    dateOfCreation: { type: Date, default: Date.now }, 
  },
  { collection: "Users" }
); 

userScema.statics.adduser = function (
  { fname, lname, mail, password },
  callback
) {
  return User.create(
    {
      fname: fname,
      lname: lname,
      email: mail,
      password: bcrypt.hashSync(password, 10),
    },
    (err, result) => {
      if (err) {
        return callback(err, null);
      } else {
        return callback(null, result);
      }
    }
  );
};
userScema.statics.getuser = function ({mail,password}, callback) {
  return User.findOne({ email: mail }, (err, result) => {
    if (err) {
      return callback(err, null);
    } else {
      if (result) {
        if (bcrypt.compareSync(password, result.password)) {
          return callback(null, result);
        } else {
          return callback(null, null);
        }
      } else {
        return callback(null, null);
      }
    }
  });
};

const User = mongoose.model("user", userScema);
module.exports = User;
