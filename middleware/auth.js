const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  try {
    next();
  } catch (err) {
    res.status(400).send({
      message: "Invalid token.",
    });
  }
};
