const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  try {
    const token = req.header("x-auth-token") || req.cookies["x-auth-token"];

    if (!token)
      return res.status(401).send({
        status: "error",
        message: "Access denied. No token provided.",
      });

    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

    if (!decoded)
      return res.status(400).send({
        status: "error",
        message: "Invalid token.",
      });

    req.user = decoded;

    next();
  } catch (err) {
    res.status(400).send({
      status: "error",
      message: "Invalid token.",
    });
  }
};
