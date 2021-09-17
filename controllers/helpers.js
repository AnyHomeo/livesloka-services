const jwt = require("jsonwebtoken")

exports.isLoggedId = async (req, res, next) => {
    const token = req.headers.authorization
  try {
    await jwt.verify(token, process.env.JWT_SECRET);
    const decoded = await jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Token Expired",
    });
  }
};

exports.isAdmin = (req, res, next) => {
    if(req.user && req.user.role === 3){
        next();
    } else {
        return res.status(401).json({
            error:"Only Admin access"
        })
    }
};
