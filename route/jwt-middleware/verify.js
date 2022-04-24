const jwt = require("jsonwebtoken");
exports.verify = (req, res, next) => {
    const authheader = req.headers.accesstoken;
    if (authheader) {
    //   
      const token = authheader.split(" ")[1];
      jwt.verify(JSON.parse(token), "secretkey", (err, user) => {
        
        if (err) return res.status(403).json("token not valid");
        else req.headers.user =user.id;
        next();
      }); 
    } else {
        console.log("no token");
      res.status(400).json({ message: "Not authenticated" });
    }
  };
