const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userScema = new mongoose.Schema(
  {
    fname: { type: String,
       required:[ true,"This field is compulsory"],
        index: { unique: false },
        match:[/^[a-zA-Z][a-zA-Z\s]*$/,"Enter a valid name"] ,
        minlength:[5,"please enter min 5 chars"],
        validate:[]},
    lname: { type: String, required: false, index: { unique: false } ,match:[/^[a-zA-Z][a-zA-Z\s]*$/,"Enter a valid name"]},
    // username:{type:String,required:false,index:{unique:false}},
    email: { type: String, required: true, index: { unique:[ true ,"Email already registered"]} },
    password: { type: String, required: true,minlength:[5,"Please enter a passowrd of atleast 5 chars"] },
    
  },
  { collection: "user" }
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
